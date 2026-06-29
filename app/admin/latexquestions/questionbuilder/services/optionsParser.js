export function parseOptions(rawText = "") {

    if (!rawText) {
        return []
    }

    let text = rawText
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .trim()

    const patterns = [

        /\n(?=A[\.\)]\s*)/i,
        /\n(?=\(A\)\s*)/i,
        /\n(?=1[\.\)]\s*)/,

    ]

    let parts = null

    for (const pattern of patterns) {

        const temp = text.split(pattern)

        if (temp.length > 1) {

            parts = temp

            break

        }

    }

    if (!parts) {

        parts = text.split(/\n+/)

    }

    const options = []

    for (let item of parts) {

        item = item
            .replace(/^(A|B|C|D|E|F)[\.\)]\s*/i, "")
            .replace(/^\((A|B|C|D|E|F)\)\s*/i, "")
            .replace(/^\d+[\.\)]\s*/, "")
            .trim()

        if (item.length) {

            options.push(item)

        }

    }

    return options

}
