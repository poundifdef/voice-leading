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
    getOctave,
    getAccidental,
    hasAccidental,
    getNote,
    noteToMidi
} = require('music-fns');

key = 'G';
//quality = Scale.NATURAL_MINOR
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
    'viid': createChord(getLeadingTone(scale), Chord.DIMINISHED),

    // TODO: raise leading tone
    'i': createChord(getTonic(scale), Chord.MINOR),
    'iid': createChord(getSupertonic(scale), Chord.DIMINISHED),
    'III': createChord(getMediant(scale), Chord.MAJOR),
    'iv': createChord(getSubdominant(scale), Chord.MINOR),
    'V': createChord(getDominant(scale), Chord.MAJOR),
    'VI': createChord(getSubmediant(scale), Chord.MAJOR),
    'VII': createChord(getLeadingTone(scale), Chord.MAJOR),

    'I7': createChord(getTonic(scale), Chord.MAJOR_SEVENTH),
    'ii7': createChord(getSupertonic(scale), Chord.MINOR_SEVENTH),
    'iii7': createChord(getMediant(scale), Chord.MINOR_SEVENTH),
    'IV7': createChord(getSubdominant(scale), Chord.MAJOR_SEVENTH),
    'V7': createChord(getDominant(scale), Chord.SEVENTH),
    'vi7': createChord(getSubmediant(scale), Chord.MINOR_SEVENTH),
    'vii7': createChord(getLeadingTone(scale), Chord.DIMINISHED) + getSubmediant(scale),
}


progression = [
    ['I', 0],
    ['I', 0],
    ['IV', 1],
    ['I', 1],
    ['vi', 0],
    ['vi', 0],
    ['ii', 0],
    ['I', 1],
    ['ii', 1],
    ['V7', 0],
    ['V', 1],
    ['V7', 0],
    ['I', 0],
    ['vi', 0],
    ['IV', 0],
    ['I', 1],
    ['vi', 0],
    ['vi7', 0],
    ['ii', 1],
    ['ii', 1], // viio7/V
    ['V', 0],
    ['I', 0],
];
/*
progression = [
    ['i', 0],
    ['i', 1],
    ['V', 2],
    ['i', 0],
    ['ii', 0],
    ['V', 0],
    ['i', 1],
    ['V', 2],
    ['i', 0],
    ['i', 1],
    ['V', 0],
    ['i', 0],
]
*/

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

        if (chord_tones.length == 3) {
            s.push(chord_tones[0]);
            a.push(chord_tones[1]);
            t.push(chord_tones[2]);
        } else {
            remaining_tones = new Set(chord_tones);
            remaining_tones.delete(chord_tones[inversion])
            remaining_array = Array.from(remaining_tones)
            s.push(remaining_array[0]);
            a.push(remaining_array[1]);
            t.push(remaining_array[2]);
        }

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

        alto_interval = getIntervals([getNote(a[i]), getNote(s[i])])[0];
        a[i] = transpose(s[i], -alto_interval);

        tenor_interval = getIntervals([getNote(t[i]), getNote(a[i])])[0];
        t[i] = transpose(a[i], -tenor_interval);


    } else {
        prev = [s[i-1], a[i-1], t[i-1], b[i-1]];

        combinations = []

        these_chord_tones = [];
        is_seventh = false;

        if (chord_tones.length == 3) {
            these_chord_tones.push(chord_tones[0]);
            these_chord_tones.push(chord_tones[1]);
            these_chord_tones.push(chord_tones[2]);
        } else {
            is_seventh = true;
            remaining_tones = new Set(chord_tones);
            remaining_tones.delete(chord_tones[inversion])
            remaining_array = Array.from(remaining_tones)
            these_chord_tones.push(remaining_array[0]);
            these_chord_tones.push(remaining_array[1]);
            these_chord_tones.push(remaining_array[2]);
        }

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                for (z = 0; z < 3; z++) {
                    combinations.push([these_chord_tones[x], these_chord_tones[y], these_chord_tones[z], b[i]]);
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
            unique_notes = new Set(combo).size;

            if (is_seventh && unique_notes != 4) {
                combinations.splice(j, 1);
                continue;
            }
            if (!is_seventh && unique_notes != 3) {
                combinations.splice(j, 1);
                continue;
            }
        }

        for (j = combinations.length-1; j >= 0; j--) {
            var combo = combinations[j];

            sop_interval_up = getIntervals([getNote(s[i-1]), getNote(combinations[j][0])])[0];
            sop_interval_down = getIntervals([getNote(combinations[j][0]), getNote(s[i-1])])[0];
            sop_final = sop_interval_up < sop_interval_down ? sop_interval_up : -sop_interval_down;
            combinations[j][0] = transpose(s[i-1], sop_final);

            alt_interval_up = getIntervals([getNote(a[i-1]), getNote(combinations[j][1])])[0];
            alt_interval_down = getIntervals([getNote(combinations[j][1]), getNote(a[i-1])])[0];
            alt_final = alt_interval_up < alt_interval_down ? alt_interval_up : -alt_interval_down;
            combinations[j][1] = transpose(a[i-1], alt_final);

            ten_interval_up = getIntervals([getNote(t[i-1]), getNote(combinations[j][2])])[0];
            ten_interval_down = getIntervals([getNote(combinations[j][2]), getNote(t[i-1])])[0];
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

                    if (getRoot(prev[y]) == getRoot(combo[y])) {
                        continue;
                    }
                    prev_interval = Math.abs(getIntervals([getRoot(prev[x]), getRoot(prev[y])])[0])
                    cur_interval = Math.abs(getIntervals([getRoot(combo[x]), getRoot(combo[y])])[0])

                    //if (j == 6) {
                    //console.log(prev[x], prev[y], combo[x], combo[y], prev_interval, cur_interval);
                    //}

                    if (prev_interval == cur_interval) {
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
            } else {
                if (combinations[j][0] == 'B4') {
                //console.log(j)
                //console.log(s, a, t, b)
                //console.log(combinations[j])
                prev_interval = Math.abs(getIntervals([getRoot(s[0]), getRoot(b[0])])[0])
                cur_interval = Math.abs(getIntervals([getRoot(combinations[j][0]), getRoot(combinations[j][3])])[0])
                //console.log(prev_interval, cur_interval, prev_interval == cur_interval, prev_interval % Interval.PERFECT_OCTAVE)
                }
            }
        }

        for (j = combinations.length-1; j >= 0; j--) {
            var combo = combinations[j];
            if (noteToMidi(combo[0]) > noteToMidi('C6')) {
                combinations.splice(j, 1);
                continue;
            }
        }

        //console.log(combinations)
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
console.log("M:3/4");
console.log("L:1/4");
console.log("K:G");
console.log("Q:70");
console.log("%%staves {1}");
console.log("%%staves {1 2 3 4}");
console.log("V:1 [K:clef=treble]");

accidental_string = {
    "#": "^",
    "b": '_'
}

for (i = 0; i < s.length; i++) {
    note = getRoot(s[i]);
    octave = getOctave(s[i]);
    accidental = hasAccidental(s[i]) ? accidental_string[getAccidental(s[i])] : "=";

    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(accidental + note + octave_string[octave]);
}

console.log("V:2 [K:clef=treble]");
for (i = 0; i < a.length; i++) {
    note = getRoot(a[i]);
    octave = getOctave(a[i]);
    accidental = hasAccidental(a[i]) ? accidental_string[getAccidental(a[i])] : "=";
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(accidental + note + octave_string[octave]);
}

console.log("V:3 [K:clef=bass]");
for (i = 0; i < t.length; i++) {
    note = getRoot(t[i]);
    octave = getOctave(t[i]);
    accidental = hasAccidental(t[i]) ? accidental_string[getAccidental(t[i])] : "=";
    //console.log("JAY", t[i])
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(accidental + note + octave_string[octave]);
}
console.log("V:4 [K:clef=bass]");
for (i = 0; i < b.length; i++) {
    note = getRoot(b[i]);
    octave = getOctave(b[i]);
    accidental = hasAccidental(b[i]) ? accidental_string[getAccidental(b[i])] : "=";
    octave_string = {
        1: ',,,',
        2: ',,',
        3: ',',
        4: '',
        5: "'",
        6: "''",
        7: "'''",
    }
    console.log(accidental + note + octave_string[octave]);
}
/*
console.log(s)
console.log(a)
console.log(t)
console.log(b)
*/
