export const ASIA_INFRA_FULL_ACCESS = [
  'kishore@techbium.com'
]

export const ASIA_INFRA_EXPENSE_ACCESS = [
  'techbium.hr@gmail.com'
]

export const ASIA_INFRA_VIEW_ACCESS = [
  'asiainfra@asiainfra.in'
]

export function getAsiaInfraRole(email) {

  if (!email) return null

  if (ASIA_INFRA_FULL_ACCESS.includes(email)) {
    return 'owner'
  }

  if (ASIA_INFRA_EXPENSE_ACCESS.includes(email)) {
    return 'expense_operator'
  }

  if (ASIA_INFRA_VIEW_ACCESS.includes(email)) {
    return 'viewer'
  }

  return null
}

export function canViewAsiaInfra(email) {
  return getAsiaInfraRole(email) !== null
}

export function canManageProjects(email) {
  return getAsiaInfraRole(email) === 'owner'
}

export function canManageExpenses(email) {

  const role = getAsiaInfraRole(email)

  return (
    role === 'owner' ||
    role === 'expense_operator'
  )
}
