// lib/ai_cashflow.js

export function getCurrentCapitalBlocked(project){

    return Math.max(

        Number(project.expenses || 0)

        -

        Number(project.collections || 0),

        0

    )

}

export function calculatePeakCapital(
    transactions
){

    const sorted = [...transactions].sort(

        (a,b)=>{

            if(

                a.transaction_date <
                b.transaction_date

            ) return -1

            if(

                a.transaction_date >
                b.transaction_date

            ) return 1

            if(
                a.transaction_type ===
                b.transaction_type
            ) return 0

            return a.transaction_type ===
            'Expense'

            ? -1

            : 1

        }

    )

    let running = 0

    let peak = 0

    sorted.forEach(row=>{

        if(

            row.transaction_type ===
            'Expense'

        ){

            running +=
            Number(row.amount)

        }else{

            running -=
            Number(row.amount)

        }

        if(running > peak){

            peak = running

        }

    })

    return Math.max(peak,0)

}

export function getPeakCapital(
    projectId,
    cashflow
){

    return calculatePeakCapital(

        cashflow.filter(

            row=>

            row.project_id===projectId

        )

    )

}

export function getCapitalRecycling(
    project,
    cashflow
){

    const peak =
    getPeakCapital(
        project.id,
        cashflow
    )

    if(peak===0){

        return 0

    }

    return Number(

        project.collections || 0

    ) / peak

}
export function getInvoiceTotal(transactions){

return transactions
.filter(x=>x.transaction_type==='Invoice')
.reduce((sum,x)=>sum+Number(x.amount||0),0)

}

export function getCollectionTotal(transactions){

return transactions
.filter(x=>x.transaction_type==='Collection')
.reduce((sum,x)=>sum+Number(x.amount||0),0)

}

export function getExpenseTotal(transactions){

return transactions
.filter(x=>x.transaction_type==='Expense')
.reduce((sum,x)=>sum+Number(x.amount||0),0)

}
