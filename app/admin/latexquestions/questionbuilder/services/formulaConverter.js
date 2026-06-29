export function convertFormula(text){

    if(!text) return ""

    let output = text.trim()

    /* ===========================
       Greek Letters
    =========================== */

    output = output
        .replace(/α/g,"\\alpha")
        .replace(/β/g,"\\beta")
        .replace(/γ/g,"\\gamma")
        .replace(/θ/g,"\\theta")
        .replace(/λ/g,"\\lambda")
        .replace(/π/g,"\\pi")
        .replace(/Δ/g,"\\Delta")
        .replace(/μ/g,"\\mu")
        .replace(/ρ/g,"\\rho")

    /* ===========================
       Chemistry
    =========================== */

    output = output.replace(

        /\b([A-Z][a-z]?)(\d+)/g,

        "$1_{$2}"

    )

    /* ===========================
       Superscripts
    =========================== */

    output = output.replace(

        /([A-Za-z\)\}])(-?\d+)/g,

        (match,left,num)=>{

            if(left==="}") return match

            return left+"^{"+num+"}"

        }

    )

    /* ===========================
       Square Root
    =========================== */

    output = output.replace(

        /sqrt\s*\((.*?)\)/gi,

        "\\sqrt{$1}"

    )

    output = output.replace(

        /√([A-Za-z0-9]+)/g,

        "\\sqrt{$1}"

    )

    /* ===========================
       Fractions
    =========================== */

    output = output.replace(

        /([A-Za-z0-9\\{}]+)\s*\/\s*([A-Za-z0-9\\{}]+)/g,

        "\\frac{$1}{$2}"

    )

    /* ===========================
       Relations
    =========================== */

    output = output
        .replace(/<=/g,"\\le")
        .replace(/>=/g,"\\ge")
        .replace(/!=/g,"\\neq")
        .replace(/≈/g,"\\approx")

    /* ===========================
       Wrap
    =========================== */

    return "\\(" + output + "\\)"

}
