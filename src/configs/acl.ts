import { AbilityBuilder, Ability } from '@casl/ability'

export type Subjects =
  | 'all'
  | 'dashboard'
  | 'analytics'
  | 'reports'
  | 'commissions'
  | 'agent-management'
  | 'customers'
  | 'transactions'
  | 'user-management'
  | 'system-management'
  | 'chat'
  | 'email'
  | 'faq'
  | 'help-center'
  | 'calendar'
  | 'super_agent'
  | 'franchise'
  | 'regional_manager'

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'analyze' | 'export'

export type AppAbility = Ability<[Actions, Subjects]>

export const AppAbility = Ability as any

export type ACLObj = {
  action: Actions
  subject: Subjects
}

const defineRulesFor = (role: string) => {
  const { can, cannot, rules } = new AbilityBuilder(AppAbility)

  switch (role) {
    case 'admin':
      can('manage', 'all')
      break

    case 'analyst':
      can('read', 'dashboard')
      can(['read', 'analyze'], 'analytics')
      can('read', 'agent-management')
      can(['read', 'export'], 'reports')
      can('read', 'commissions')
      can('read', 'transactions')
      can('read', 'chat')
      can('read', 'email')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
      cannot('manage', 'customers')
      break

    case 'super_agent':
      can('read', 'super_agent')
      can('read', 'dashboard')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
      cannot('manage', 'analytics')
      cannot('manage', 'customers')
      break

    case 'franchise':
      can('read', 'franchise')
      can('read', 'dashboard')
      can('read', 'customers')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
      cannot('manage', 'analytics')
      break

    case 'regional_manager':
      can('read', 'regional_manager')
      can('read', 'dashboard')
      can(['read', 'update'], 'agent-management')
      can('read', 'commissions')
      can('read', 'analytics')
      can('read', 'reports')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
      cannot('manage', 'user-management')
      cannot('manage', 'system-management')
      break

    case 'agent':
      can('read', 'dashboard')
      can('read', 'transactions')
      can('read', 'commissions')
      can('read', 'chat')
      can('read', 'email')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
      cannot('manage', 'agent-management')
      cannot('manage', 'analytics')
      cannot('manage', 'reports')
      break

    default:
      can('read', 'dashboard')
      can('read', 'chat')
      can('read', 'email')
      can('read', 'faq')
      can('read', 'help-center')
      can('read', 'calendar')
  }

  return rules
}

export const buildAbilityFor = (role: string): AppAbility => {
  return new AppAbility(defineRulesFor(role), {
    detectSubjectType: (object: any) => object!.type
  })
}

export const defaultACLObj: ACLObj = {
  action: 'manage',
  subject: 'all'
}

export default defineRulesFor
