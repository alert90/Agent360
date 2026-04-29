// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): VerticalNavItemsType => {
  return [
    {
      title: 'Dashboards',
      icon: 'tabler:smart-home',
      children: [
        {
          title: 'Admin',
          path: '/dashboard/admin',
          action: 'manage',
          subject: 'all'
        },
        {
          title: 'RMS',
          path: '/dashboard/rms',
          action: 'read',
          subject: 'regional-manager'
        },
        {
          title: 'Analyst',
          path: '/dashboard/analyst',
          action: 'read',
          subject: 'analytics'
        },
        {
          title: 'Super Agent',
          path: '/dashboard/sa',
          action: 'read',
          subject: 'super_agent'
        },
        {
          title: 'Franchise',
          path: '/dashboard/franchise',
          action: 'read',
          subject: 'franchise'
        }
      ]
    },
    {
      sectionTitle: 'Core Features'
    },
    {
      title: 'Agents',
      icon: 'tabler:users',
      action: 'read',
      subject: 'agent-management',
      children: [
        {
          title: 'All Agents',
          path: '/agents/list',
          action: 'read',
          subject: 'agent-management'
        },
        {
          title: 'Add Agent',
          path: '/agents/add',
          action: 'create',
          subject: 'agent-management'
        },
        {
          title: 'Agent Performance',
          path: '/agents/performance',
          action: 'read',
          subject: 'agent-management'
        }
      ]
    },
    {
      title: 'Transactions',
      icon: 'tabler:transaction-dollar',
      action: 'read',
      subject: 'transactions',
      children: [
        {
          title: 'All Transactions',
          path: '/transactions/list',
          action: 'read',
          subject: 'transactions'
        },
        {
          title: 'Transaction History',
          path: '/transactions/history',
          action: 'read',
          subject: 'transactions'
        }
      ]
    },
    {
      title: 'Commissions',
      icon: 'tabler:currency-dollar',
      action: 'read',
      subject: 'commissions',
      children: [
        {
          title: 'Past Commissions',
          path: '/commission/overview',
          action: 'read',
          subject: 'commissions'
        },
        {
          title: 'Commission Reports',
          path: '/commission/report',
          action: 'read',
          subject: 'commissions'
        },
        {
          title: 'Commission Settings',
          path: '/commission/config',
          action: 'read',
          subject: 'commissions'
        }
      ]
    },
    {
      title: 'Reports & Analytics',
      icon: 'tabler:chart-bar',
      action: 'read',
      subject: 'reports',
      children: [
        {
          title: 'Performance Reports',
          path: '/report/performance',
          action: 'read',
          subject: 'reports'
        },
        {
          title: 'Financial Reports',
          path: '/report/financial',
          action: 'read',
          subject: 'reports'
        },
        {
          title: 'Agent Reports',
          path: '/report/agent',
          action: 'read',
          subject: 'reports'
        }
      ]
    },
    {
      sectionTitle: 'Administration'
    },
    {
      title: 'Roles & Permissions',
      icon: 'tabler:settings',
      action: 'manage',
      subject: 'system-management',
      children: [
        {
          title: 'Users',
          path: '/apps/user/list',
          action: 'read',
          subject: 'user-management'
        },
        {
          title: 'Roles',
          path: '/apps/roles',
          action: 'manage',
          subject: 'system-management'
        },
        {
          title: 'Permissions',
          path: '/apps/permissions',
          action: 'manage',
          subject: 'system-management'
        }
      ]
    },
    {
      title: 'System Settings',
      icon: 'tabler:settings',
      action: 'manage',
      subject: 'system-management',
      children: [
        {
          title: 'General Settings',
          path: '/admin/settings/general',
          action: 'manage',
          subject: 'system-management'
        }
      ]
    },
    {
      sectionTitle: 'Support & Help'
    },
    {
      title: 'Help Center',
      icon: 'tabler:help',
      path: '/pages/help-center',
      action: 'read',
      subject: 'help-center'
    },
    {
      title: 'FAQ',
      path: '/pages/faq',
      action: 'read',
      subject: 'faq'
    }
  ]
}

export default navigation
