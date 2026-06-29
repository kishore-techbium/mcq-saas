'use client'

import QuestionEditor from '../QuestionEditor'
import OptionsEditor from '../OptionsEditor'

export default function MiddlePanel({

    question,

    setQuestion,

    optionsRaw,

    options,

    setOptions

}){

    return(

        <>

            <QuestionEditor

                question={question}

                setQuestion={setQuestion}

            />

            <OptionsEditor

                rawText={optionsRaw}

                options={options}

                setOptions={setOptions}

            />

        </>

    )

}
