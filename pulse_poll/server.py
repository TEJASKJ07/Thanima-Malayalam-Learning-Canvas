import asyncio
import json
from pathlib import Path
from aiohttp import web

HTML_DIR = Path(__file__).parent
PORT = 8000


class PollState:
    def __init__(self):
        self.title = "Select your preferred team representative"
        self.max_votes = 1
        self.candidates = [
            {"id": 1, "name": "Alpha Team Representative"},
            {"id": 2, "name": "Beta Team Representative"},
            {"id": 3, "name": "Gamma Team Representative"},
        ]
        self.votes = {1: 0, 2: 0, 3: 0}
        self.next_id = 4
        self.version = 1

    def voter_payload(self):
        return {
            "title": self.title,
            "maxVotesPerUser": self.max_votes,
            "candidates": [{"id": c["id"], "name": c["name"]} for c in self.candidates],
            "version": self.version,
        }

    def results_payload(self):
        total = sum(self.votes.values())
        candidates = []
        for c in self.candidates:
            v = self.votes.get(c["id"], 0)
            pct = round((v / total * 100), 1) if total else 0.0
            candidates.append({"name": c["name"], "votes": v, "percentage": pct})
        return {"title": self.title, "totalVotes": total, "candidates": candidates}

    def cast_vote(self, candidate_ids):
        valid_ids = {c["id"] for c in self.candidates}
        for cid in list(candidate_ids)[: self.max_votes]:
            if cid in valid_ids:
                self.votes[cid] = self.votes.get(cid, 0) + 1

    def publish(self, title, max_votes, names):
        self.title = title or self.title
        self.max_votes = max(1, int(max_votes or 1))
        self.candidates = []
        self.votes = {}
        for name in names:
            cid = self.next_id
            self.next_id += 1
            self.candidates.append({"id": cid, "name": name})
            self.votes[cid] = 0
        self.version += 1

    def reset_votes(self):
        for cid in self.votes:
            self.votes[cid] = 0
        self.version += 1


POLL = PollState()
CONNECTED_CLIENTS = set()


async def broadcast(message: dict):
    if not CONNECTED_CLIENTS:
        return
    data = json.dumps(message)
    await asyncio.gather(
        *(ws.send_str(data) for ws in list(CONNECTED_CLIENTS)),
        return_exceptions=True,
    )


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    CONNECTED_CLIENTS.add(ws)

    try:
        await ws.send_str(json.dumps({"type": "poll_state", "data": POLL.voter_payload()}))
        await ws.send_str(
            json.dumps({"type": "vote_update", "data": POLL.results_payload()})
        )

        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    continue

                mtype = data.get("type")
                if mtype == "get_poll":
                    await ws.send_str(
                        json.dumps(
                            {"type": "poll_state", "data": POLL.voter_payload()}
                        )
                    )
                    await ws.send_str(
                        json.dumps(
                            {"type": "vote_update", "data": POLL.results_payload()}
                        )
                    )
                elif mtype == "vote":
                    POLL.cast_vote(data.get("candidateIds", []))
                    await broadcast(
                        {"type": "vote_update", "data": POLL.results_payload()}
                    )
                elif mtype == "admin_publish":
                    pdata = data.get("data", {})
                    POLL.publish(
                        pdata.get("title"),
                        pdata.get("maxVotes"),
                        pdata.get("candidates", []),
                    )
                    await broadcast(
                        {"type": "poll_state", "data": POLL.voter_payload()}
                    )
                    await broadcast(
                        {"type": "vote_update", "data": POLL.results_payload()}
                    )
                elif mtype == "admin_reset":
                    POLL.reset_votes()
                    await broadcast(
                        {"type": "poll_state", "data": POLL.voter_payload()}
                    )
                    await broadcast(
                        {"type": "vote_update", "data": POLL.results_payload()}
                    )
    finally:
        CONNECTED_CLIENTS.discard(ws)

    return ws


def load_html(filename: str) -> str:
    return (HTML_DIR / filename).read_text(encoding="utf-8")


def inject(html: str, extra_script: str) -> str:
    marker = "</body>"
    snippet = f"<script>\n{extra_script}\n</script>\n{marker}"
    if marker in html:
        return html.replace(marker, snippet, 1)
    return html + snippet


VOTER_WIRING = """
(function() {
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(wsProtocol + '//' + location.host + '/ws');
    const VOTE_KEY = "pulsepoll_voted_version";
    let currentVersion = null;

    function hasVotedThisRound() {
        return localStorage.getItem(VOTE_KEY) === String(currentVersion);
    }

    function lockBallotAsVoted() {
        const btn = document.getElementById('btnSubmit');
        if (btn) {
            btn.disabled = true;
            btn.classList.add('cursor-not-allowed', 'opacity-50');
            btn.classList.remove('cursor-pointer');
            const label = btn.querySelector('span:last-child');
            if (label) label.innerText = "Vote Already Submitted";
        }
        document.querySelectorAll('.option-card').forEach(function(c) {
            c.style.pointerEvents = 'none';
            c.style.opacity = '0.55';
        });
        const tip = document.getElementById('submissionTip');
        if (tip) tip.innerText = "You have already voted in this poll.";
    }

    ws.onopen = function() { ws.send(JSON.stringify({type: "get_poll"})); };

    ws.onmessage = function(evt) {
        const msg = JSON.parse(evt.data);
        if (msg.type === "poll_state") {
            currentVersion = msg.data.version;
            renderPoll(msg.data);
            if (hasVotedThisRound()) lockBallotAsVoted();
        }
    };

    window.onload = function() {};

    window.submitVote = function() {
        if (hasVotedThisRound()) return;
        if (selectedCandidateIds.length === 0) return;
        ws.send(JSON.stringify({type: "vote", candidateIds: selectedCandidateIds}));
        localStorage.setItem(VOTE_KEY, String(currentVersion));
        lockBallotAsVoted();
        document.getElementById('confirmationBanner').classList.remove('hidden');
        document.getElementById('confirmationBanner').classList.add('flex');
    };

    const resultsLink = document.querySelector('#confirmationBanner a');
    if (resultsLink) resultsLink.setAttribute('href', '/results');
})();
"""

RESULTS_WIRING = """
(function() {
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(wsProtocol + '//' + location.host + '/ws');

    ws.onopen = function() { ws.send(JSON.stringify({type: "get_poll"})); };

    ws.onmessage = function(evt) {
        const msg = JSON.parse(evt.data);
        if (msg.type === "vote_update") {
            renderResults(msg.data);
        }
    };

    window.onload = function() {};

    const backLink = document.querySelector('header a');
    if (backLink) backLink.setAttribute('href', '/');
})();
"""

ADMIN_WIRING = """
(function() {
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(wsProtocol + '//' + location.host + '/ws');

    window.saveAndPublishPoll = function() {
        const inputs = document.querySelectorAll('.candidate-input');
        const candidates = Array.from(inputs).map(function(i) { return i.value; })
            .filter(function(v) { return v.trim() !== ""; });
        const title = document.getElementById('pollTitleInput').value.trim() || "Untitled Poll";
        const maxVotes = parseInt(document.getElementById('maxVotesInput').value) || 1;

        if (candidates.length < 2) {
            alert("Please provide at least 2 valid candidate names.");
            return;
        }
        ws.send(JSON.stringify({
            type: "admin_publish",
            data: {title: title, maxVotes: maxVotes, candidates: candidates}
        }));
        alert("Poll published live to all connected voters.");
    };

    window.resetVotes = function() {
        if (confirm("Are you sure you want to reset all current candidate votes to 0?")) {
            ws.send(JSON.stringify({type: "admin_reset"}));
            alert("Votes reset.");
        }
    };

    const streamLink = document.querySelector('a[href="#"]');
    if (streamLink) {
        streamLink.setAttribute('href', '/results');
        streamLink.setAttribute('target', '_blank');
        streamLink.setAttribute('rel', 'noopener');
    }
})();
"""


async def handle_page(request, filename, wiring):
    html = inject(load_html(filename), wiring)
    return web.Response(text=html, content_type="text/html")


app = web.Application()
app.router.add_get("/", lambda r: handle_page(r, "index.html", VOTER_WIRING))
app.router.add_get("/index", lambda r: handle_page(r, "index.html", VOTER_WIRING))
app.router.add_get(
    "/results", lambda r: handle_page(r, "results.html", RESULTS_WIRING)
)
app.router.add_get("/admin", lambda r: handle_page(r, "admin.html", ADMIN_WIRING))
app.router.add_get("/ws", websocket_handler)

if __name__ == "__main__":
    print(f"PulsePoll single-port server running on http://localhost:{PORT}")
    web.run_app(app, host="0.0.0.0", port=PORT)