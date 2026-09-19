// Malayalam Alphabet Dataset
const MALAYALAM_CURRICULUM = [
    // Vowels (സ്വരാക്ഷരങ്ങൾ)
    { id: 'v1', char: 'അ', roman: 'a', type: 'vowel', word: 'അമ്മ', translit: 'Amma', meaning: 'Mother' },
    { id: 'v2', char: 'ആ', roman: 'aa', type: 'vowel', word: 'ആന', translit: 'Aana', meaning: 'Elephant' },
    { id: 'v3', char: 'ഇ', roman: 'i', type: 'vowel', word: 'ഇല', translit: 'Ila', meaning: 'Leaf' },
    { id: 'v4', char: 'ഈ', roman: 'ee', type: 'vowel', word: 'ഈച്ച', translit: 'Eecha', meaning: 'Fly' },
    { id: 'v5', char: 'ഉ', roman: 'u', type: 'vowel', word: 'ഉറുമ്പ്', translit: 'Urumbu', meaning: 'Ant' },
    { id: 'v6', char: 'ഊ', roman: 'oo', type: 'vowel', word: 'ഊഞ്ഞാൽ', translit: 'Oonjal', meaning: 'Swing' },
    { id: 'v7', char: 'ഋ', roman: 'ru', type: 'vowel', word: 'ഋഷി', translit: 'Rishi', meaning: 'Sage' },
    { id: 'v8', char: 'എ', roman: 'e', type: 'vowel', word: 'എലി', translit: 'Eli', meaning: 'Rat' },
    { id: 'v9', char: 'ഏ', roman: 'ae', type: 'vowel', word: 'ഏണി', translit: 'Eani', meaning: 'Ladder' },
    { id: 'v10', char: 'ഐ', roman: 'ai', type: 'vowel', word: 'ഐസ്', translit: 'Ice', meaning: 'Ice' },
    { id: 'v11', char: 'ഒ', roman: 'o', type: 'vowel', word: 'ഒട്ടകം', translit: 'Ottakam', meaning: 'Camel' },
    { id: 'v12', char: 'ഓ', roman: 'oa', type: 'vowel', word: 'ഓടം', translit: 'Odam', meaning: 'Boat' },
    { id: 'v13', char: 'ഔ', roman: 'au', type: 'vowel', word: 'ഔഷധം', translit: 'Aushadham', meaning: 'Medicine' },
    { id: 'v14', char: 'അം', roman: 'am', type: 'vowel', word: 'അമ്പലം', translit: 'Ambalam', meaning: 'Temple' },
    { id: 'v15', char: 'അഃ', roman: 'aha', type: 'vowel', word: 'ദുഃഖം', translit: 'Dukham', meaning: 'Sorrow' },

    // Consonants (വ്യഞ്ജനാക്ഷരങ്ങൾ - Selection)
    { id: 'c1', char: 'ക', roman: 'ka', type: 'consonant', word: 'കണ്ണ്', translit: 'Kannu', meaning: 'Eye' },
    { id: 'c2', char: 'ഖ', roman: 'kha', type: 'consonant', word: 'ഖരം', translit: 'Kharam', meaning: 'Solid' },
    { id: 'c3', char: 'ഗ', roman: 'ga', type: 'consonant', word: 'ഗജം', translit: 'Gajam', meaning: 'Elephant' },
    { id: 'c4', char: 'ഘ', roman: 'gha', type: 'consonant', word: 'ഘടികാരം', translit: 'Ghadikaram', meaning: 'Clock' },
    { id: 'c5', char: 'ങ', roman: 'nga', type: 'consonant', word: 'മാങ്ങ', translit: 'Maanga', meaning: 'Mango' },
    { id: 'c6', char: 'ച', roman: 'cha', type: 'consonant', word: 'ചക്രം', translit: 'Chakram', meaning: 'Wheel' },
    { id: 'c7', char: 'ഛ', roman: 'chha', type: 'consonant', word: 'ഛായ', translit: 'Chhaya', meaning: 'Shadow' },
    { id: 'c8', char: 'ജ', roman: 'ja', type: 'consonant', word: 'ജലം', translit: 'Jalam', meaning: 'Water' },
    { id: 'c9', char: 'ഝ', roman: 'jha', type: 'consonant', word: 'ഝഷം', translit: 'Jhasham', meaning: 'Fish' },
    { id: 'c10', char: 'ഞ', roman: 'nya', type: 'consonant', word: 'ഞണ്ട്', translit: 'Njanndu', meaning: 'Crab' },

    // Chillus (ചില്ലക്ഷരങ്ങൾ)
    { id: 'ch1', char: 'ൽ', roman: 'l', type: 'chillu', word: 'പാൽ', translit: 'Paal', meaning: 'Milk' },
    { id: 'ch2', char: 'ൾ', roman: 'L', type: 'chillu', word: 'അവൾ', translit: 'Aval', meaning: 'She' },
    { id: 'ch3', char: 'ൻ', roman: 'n', type: 'chillu', word: 'അവൻ', translit: 'Avan', meaning: 'He' },
    { id: 'ch4', char: 'ൺ', roman: 'N', type: 'chillu', word: 'കൺ', translit: 'Kan', meaning: 'Sight' },
    { id: 'ch5', char: 'ർ', roman: 'rr', type: 'chillu', word: 'നീർ', translit: 'Neer', meaning: 'Water' }
];