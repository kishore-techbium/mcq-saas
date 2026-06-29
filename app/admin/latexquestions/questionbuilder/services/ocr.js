import Tesseract from "tesseract.js"

export async function recognizeImage(

    file,

    onProgress

){

    const { data } = await Tesseract.recognize(

        file,

        "eng",

        {

            logger:m=>{

                if(

                    m.status==="recognizing text"

                    &&

                    onProgress

                ){

                    onProgress(

                        Math.round(

                            m.progress*100

                        )

                    )

                }

            },

            tessedit_pageseg_mode:"6"

        }

    )

    return data.text

}
