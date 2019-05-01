// import { NOTES } from 'music-fns';
const { 
    NOTES,
    Scale,
    createScale,
    Chord,
    createChord,
    getTonic,
    getSupertonic,
    getMediant,
    getSubdominant,
    getDominant,
    getSubmediant,
    getLeadingTone,
    getIntervals,
    Interval,
    getRoot,
    transpose,
    getOctave
} = require('music-fns');

key = 'G';
quality = Scale.MAJOR
scale = createScale(key, quality)

// todo: 7th chords

chords = {
    'I': createChord(getTonic(scale), Chord.MAJOR),
    'ii': createChord(getSupertonic(scale), Chord.MINOR),
    'iii': createChord(getMediant(scale), Chord.MINOR),
    'IV': createChord(getSubdominant(scale), Chord.MAJOR),
    'V': createChord(getDominant(scale), Chord.MAJOR),
    'vi': createChord(getSubmediant(scale), Chord.MINOR),
    'vii': createChord(getLeadingTone(scale), Chord.DIMINISHED),
}

progression = [
    ['I', 0],
    ['I', 0],
    ['IV', 1],
    ['I', 1],
    ['vi', 0], //7th chord
    ['vi', 0], //7th chord
    ['ii', 0], //7th chord
    ['I', 1], //7th chord
    ['ii', 1], //7th chord
    ['V', 0], //7th chord
    ['V', 1], //7th chord
    ['V', 0], //7th chord
];

s = []
a = []
t = []
b = []

progression_length = progression.length;
for (var i = 0; i < progression_length; i++) {
    numeral = progression[i];
    var chord = numeral[0];
    var inversion = numeral[1];

    chord_tones = chords[chord];

    b.push(chord_tones[inversion])

    if (i == 0) {

        // choose lowest possible note for bass
        switch(getRoot(b[i])) {
            case 'E':
            case 'F':
            case 'G':
            case 'A':
            case 'B':
                b[i] += '2';
                break;
            default:
                b[i] += '3';
                break;
        }


        s.push(chord_tones[0]);
        a.push(chord_tones[1]);
        t.push(chord_tones[2]);

        // choose highest possible for soprano
        switch(getRoot(s[i])) {
            case 'B':
                s[i] += '4'
                break;
            default:
                s[i] += '5'
        }

        // find distance between root and 3rd
        // take inversion
        // choose alto note which is lower than root, below soprano

        alto_interval = getIntervals([getRoot(a[i]), getRoot(s[i])])[0];
        a[i] = transpose(s[i], -alto_interval);

        tenor_interval = getIntervals([getRoot(t[i]), getRoot(a[i])])[0];
        t[i] = transpose(a[i], -tenor_interval);


    } else {
        prev = [s[i-1], a[i-1], t[i-1], b[i-1]];

        combinations = []
        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                for (z = 0; z < 3; z++) {
                    combinations.push([chord_tones[x], chord_tones[y], chord_tones[z], b[i]]);
                }
            }
        }

        // find a reasonable octave, which minimizes distance,
        // for each note
        /*
        for (j = 0; j < combinations.length; j++) {
            alto_interval_up = getIntervals([getRoot(a[i-1]), getRoot(combinations[j][1])]);
            alto_interval_down = getIntervals([getRoot(combinations[j][1]), getRoot(a[i-1])]);
            console.log('alto intervals', alto_interval_up, alto_interval_down)
        }
        */

        for (j = combinations.length-1; j >= 0; j--) {
            var combo = combinations[j];
            if (new Set(combo).size != 3) {
                combinations.splice(j, 1);
                continue;
            }

            sop_interval_up = getIntervals([getRoot(s[i-1]), getRoot(combinations[j][0])])[0];
            sop_interval_down = getIntervals([getRoot(combinations[j][0]), getRoot(s[i-1])])[0];
            sop_final = sop_interval_up < sop_interval_down ? sop_interval_up : -sop_interval_down;
            combinations[j][0] = transpose(s[i-1], sop_final);

            alt_interval_up = getIntervals([getRoot(a[i-1]), getRoot(combinations[j][1])])[0];
            alt_interval_down = getIntervals([getRoot(combinations[j][1]), getRoot(a[i-1])])[0];
            alt_final = alt_interval_up < alt_interval_down ? alt_interval_up : -alt_interval_down;
            combinations[j][1] = transpose(a[i-1], alt_final);

            ten_interval_up = getIntervals([getRoot(t[i-1]), getRoot(combinations[j][2])])[0];
            ten_interval_down = getIntervals([getRoot(combinations[j][2]), getRoot(t[i-1])])[0];
            ten_final = ten_interval_up < ten_interval_down ? ten_interval_up : -ten_interval_down;
            combinations[j][2] = transpose(t[i-1], ten_final);

            switch(getRoot(combinations[j][3])) {
                case 'E':
                case 'F':
                case 'G':
                case 'A':
                case 'B':
                    combinations[j][3] += '2';
                    break;
                default:
                    combinations[j][3] += '3';
                    break;
            }

            var delete_parallel = false;
            for (x = 0; x < 4; x++) {
                for (y = 0; y < 4; y++) {
                    if (x == y) {
                        continue;
                    }
                    prev_interval = getIntervals([prev[x], prev[y]])[0]
                    cur_interval = getIntervals([combo[x], combo[y]])[0]

                    //console.log(x, y, prev_interval, cur_interval);

                    if (prev_interval == cur_interval) {
                        console.log(prev_interval);
                        if (prev_interval % Interval.PERFECT_FIFTH == 0) {
                            delete_parallel = true;
                            //console.log('delete 5th')
                        }
                        if (prev_interval % Interval.PERFECT_OCTAVE == 0) {
                            //console.log('delete 8th')
                            delete_parallel = true;
                        }

                    }
                }
            }

            if (delete_parallel) {
                combinations.splice(j, 1);
                continue;
            }
        }

        // choose combination with the smoothest voice leading
        voice_leadings = []
        for (j = 0; j < combinations.length; j++) {
            combo = combinations[j]

            distances = 0;
            distances += Math.abs(getIntervals([s[i-1], combo[0]])[0]);
            distances += Math.abs(getIntervals([a[i-1], combo[1]])[0]);
            distances += Math.abs(getIntervals([t[i-1], combo[2]])[0]);
            distances += Math.abs(getIntervals([b[i-1], combo[3]])[0]);

            voice_leadings.push(distances)

        }
        least_voice_leading = voice_leadings.indexOf(Math.min(...voice_leadings))
        s.push(combinations[least_voice_leading][0]);
        a.push(combinations[least_voice_leading][1]);
        t.push(combinations[least_voice_leading][2]);
        b[i] = combinations[least_voice_leading][3];
    }
}

console.log("X:1");
console.log("T:Grand Staff With Four Voices");
console.log("M:4/4");
console.log("L:1/2");
console.log("K:G");
console.log("%%staves {1}");
console.log("%%staves {1 2 3 4}");
console.log("V:1 [K:clef=treble]");

for (i = 0; i < s.length; i++) {
    note = getRoot(s[i]);
    octave = getOctave(s[i]);
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(note + octave_string[octave]);
}

console.log("V:2 [K:clef=treble]");
for (i = 0; i < a.length; i++) {
    note = getRoot(a[i]);
    octave = getOctave(a[i]);
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(note + octave_string[octave]);
}

console.log("V:3 [K:clef=bass]");
for (i = 0; i < t.length; i++) {
    note = getRoot(t[i]);
    octave = getOctave(t[i]);
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(note + octave_string[octave]);
}
console.log("V:4 [K:clef=bass]");
for (i = 0; i < b.length; i++) {
    note = getRoot(b[i]);
    octave = getOctave(b[i]);
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(note + octave_string[octave]);
}
/*
console.log(s)
console.log(a)
console.log(t)
console.log(b)
*/
