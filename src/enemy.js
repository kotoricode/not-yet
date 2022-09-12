import { getFinish } from "./map"

const positions = [
    [[1.5, 0, 3.5]],
    [[1.35, 0, 3.125], [1.65, 0, 3.875]],
    [[1.2, 0, 2.75], [1.5, 0, 3.5], [1.8, 0, 4.25]]
]

const skelly = () => [
    4,
    28,
    [
        1,
        2,
        [1, 1],
        0,
        0,
        [1, 0, 0, 1],
        0,
        1
    ],
    "Skelly",
    [10, 10],
    [
        [4, -1]
    ],
    3
]

const bashy = () => [
    5,
    28,
    [
        1,
        2,
        [1, 1],
        0,
        0,
        [1, 0, 0, 1],
        0,
        1
    ],
    "Bashy",
    [15, 15],
    [
        [5, -1]
    ],
    12
]

const mummy = () => [
    6,
    28,
    [
        1,
        2,
        [1, 1],
        0,
        0,
        [1, 0, 0, 1],
        0,
        1
    ],
    "Mummy",
    [25, 25],
    [
        [6, -1]
    ],
    22
]

const haunty = () => [
    7,
    28,
    [
        1,
        2,
        [1, 1],
        0,
        0,
        [1, 0, 0, 1],
        0,
        1
    ],
    "Haunty",
    [36, 36],
    [
        [6, -1]
    ],
    42
]

const reaper = () => [
    8,
    100,
    [
        1,
        2,
        [1, 1],
        0,
        0,
        [1, 0, 0, 1],
        0,
        1
    ],
    "Reaper",
    [200, 200],
    [
        [7, -1]
    ],
    0
]

export const getEnemies = layer =>
{
    const random = Math.random()

    const enemies = []

    if (!layer)
    {
        if (getFinish())
        {
            enemies.push(reaper())
        }
        else
        {
            enemies.push(skelly())

            if (random < .5)
            {
                enemies.push(skelly())
            }
        }
    }

    if (layer == 1)
    {
        enemies.push(skelly())

        if (random < .4)
        {
            enemies.push(skelly())
        }
        else if (random < .8)
        {
            enemies.push(skelly(), skelly())
        }
        else
        {
            enemies.push(bashy())
        }
    }

    if (layer == 2)
    {
        if (random < .2)
        {
            enemies.push(skelly(), skelly(), skelly())
        }
        else if (random < .8)
        {
            enemies.push(bashy(), bashy())
        }
        else
        {
            enemies.push(skelly(), bashy(), bashy())
        }
    }

    if (layer == 3)
    {
        if (random < .2)
        {
            enemies.push(bashy(), bashy(), bashy())
        }
        else if (random < .8)
        {
            enemies.push(skelly(), bashy(), mummy())
        }
        else
        {
            enemies.push(mummy(), mummy())
        }
    }

    if (layer == 4)
    {
        if (random < .2)
        {
            enemies.push(mummy(), mummy())
        }
        else if (random < .8)
        {
            enemies.push(mummy(), bashy(), mummy())
        }
        else
        {
            enemies.push(mummy(), haunty())
        }
    }

    if (layer == 5)
    {
        enemies.push(haunty(), haunty(), haunty())
    }

    for (let i = 0; i < enemies.length; i++)
    {
        enemies[i][2][3] = new DOMMatrix().translate(...positions[enemies.length - 1][i])
    }

    return enemies
}
