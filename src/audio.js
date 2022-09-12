const music = [
    0, // active track index

    // Layer 1
    [
        .5, // trackGain
        8, // trackLength
        [
            [
                [6, 14, 26, 37, 39, 41, 54, 55],
                200,
            ],

            [
                [2, 4, 7, 13, 15, 22, 25, 28, 34, 36, 42, 47, 50, 56, 58, 61],
                170,
            ],

            [
                [1, 9, 11, 17, 18, 20, 24, 29, 43, 46, 52, 57, 62],
                150,
            ],
        ]
    ],

    // Layer 2
    [
        .5,
        8,
        [
            [
                [3, 54],
                360
            ],
            [
                [7, 8, 19, 40, 50, 52, 55],
                340
            ],
            [
                [9, 14, 17, 20, 27, 36, 38, 41, 49, 57],
                300
            ],
            [
                [4, 13, 25, 33, 34, 45, 46, 60],
                250
            ],
            [
                [28, 43],
                240
            ],
            [
                [1, 23, 63],
                230
            ],
        ],
    ],

    // Layer 3
    [
        .5,
        8,
        [
            [
                [13],
                280
            ],
            [
                [12],
                270
            ],
            [
                [4, 11, 22, 25, 33],
                260
            ],
            [
                [1, 2, 9, 17, 20, 23, 27, 28, 35, 36, 37, 40, 56, 60, 61],
                250
            ],
            [
                [8, 14, 18, 19, 29, 38, 52],
                240
            ],
            [
                [30, 42, 43, 51, 54, 59, 62, 63],
                230,
            ],
            [
                [7, 45, 49],
                220
            ],
            [
                [47],
                210
            ],
        ]
    ],

    // Layer 4
    [
        .4,
        4,
        [
            [
                [7, 11],
                330,
            ],
            [
                [8, 13, 29],
                310,
            ],
            [
                [3, 4, 14, 17, 25, 31],
                280,
            ],
            [
                [2, 18, 21, 26],
                270,
            ],
            [
                [1, 20],
                260,
            ],

            [
                [3, 7, 11, 15, 19, 23, 27, 31],
                150,
            ],

            [
                [1, 6, 9, 13, 14, 17, 22, 25, 29, 30],
                140,
            ],
        ]
    ],

    // Layer 5
    [
        .4,
        4,
        [
            [
                [0, 1, 3, 4, 8, 9, 11, 12, 16, 17, 19, 20, 24, 25, 27, 28],
                150
            ],
            [
                [2, 10, 18, 26],
                260
            ],
            [
                [6, 14, 22, 30],
                210
            ],
            [
                [0, 1, 2, 11, 13, 15, 16, 17, 18, 25, 28, 29],
                350
            ]
        ]
    ],

    // Layer 6
    [
        .5,
        16,
        [
            [
                [8, 40],
                400
            ],
            [
                [6, 38, 68],
                380
            ],
            [
                [81, 82, 98, 99],
                370
            ],
            [
                [3, 4, 19, 25, 35, 36, 51, 57, 64, 65, 76, 84, 92, 96, 97, 102, 103, 120, 121],
                360
            ],
            [
                [12, 17, 27, 44, 49, 59, 67, 71, 80, 86, 104, 107, 108, 110, 112, 116, 117, 123, 124, 126],
                350
            ],
            [
                [24, 56, 72, 73, 74, 87, 119],
                340
            ],
            [
                [1, 10, 16, 33, 42, 48, 89],
                330
            ],
            [
                [0, 32, 90],
                320
            ],
            [
                [
                    2, 8, 14,
                    18, 24, 30,
                    34, 40, 46,
                    50, 56, 62,
                    66, 72, 78,
                    82, 88, 94,
                    98, 104, 110,
                    114, 120, 126
                ],
                130
            ],

            [
                [
                    0, 1, 5, 7, 11, 12,
                    16, 17, 21, 23, 27, 28,
                    32, 33, 37, 39, 43, 44,
                    48, 49, 53, 55, 59, 60,
                    64, 65, 69, 71, 75, 76,
                    80, 81, 85, 87, 91, 92,
                    96, 97, 101, 103, 107, 108,
                    112, 113, 117, 119, 123, 124
                ],
                110
            ]
        ]
    ],
]

let ctx
let intervalId

export const playAudio = (trackIndex) =>
{
    if (music[0] - trackIndex)
    {
        music[0] = trackIndex
        let ms = 0
        let end = 0

        if (ctx)
        {
            clearInterval(intervalId)
            ctx.close()
        }

        ctx = new AudioContext()

        intervalId = setInterval(() =>
        {
            ms ||= 400

            if (end - ctx.currentTime < 1)
            {
                const [trackGain, trackLength, trackInstruments] = music[music[0]]
                const start = end
                end += trackLength
                trackInstruments.map(([instrumentTimings, instrumentFrequency]) =>
                {
                    instrumentTimings.map(time =>
                    {
                        const gain = ctx.createGain()
                        gain.gain.setValueAtTime(trackGain, start + time / 8)
                        gain.gain.setValueAtTime(trackGain, start + time / 8 + .09)
                        gain.gain.exponentialRampToValueAtTime(.01, start + time / 8 + .1)
                        gain.connect(ctx.destination)

                        const oscillator = ctx.createOscillator()
                        oscillator.type = "triangle"
                        oscillator.frequency.setValueAtTime(instrumentFrequency, start + time / 8)
                        oscillator.start(start + time / 8)
                        oscillator.stop(start + time / 8 + .1)
                        oscillator.connect(gain)
                    })
                })
            }
        }, ms)
    }
}
