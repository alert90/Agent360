// ** Mock
import mock from 'src/@fake-db/mock'

// ** Types
import { UsersType, ProjectListDataType, UserRole, UserStatus } from 'src/types/apps/userTypes'

const data: { users: UsersType[] } = {
  users: [
    // Admin Users
    {
      id: 1,
      billing: 'Auto Debit',
      fullName: 'Nicky Miles',
      company: 'CyberWiz LTD',
      role: 'admin' as UserRole,
      username: 'ennexica',
      country: 'Tanzania',
      contact: '+255 789 456 123',
      email: 'admin@cyberwiz.world',
      currentPlan: 'enterprise',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/1.png',
      permissions: ['all'],
      joinDate: '2024-01-01'
    },
    {
      id: 2,
      billing: 'Auto Debit',
      fullName: 'System Administrator',
      company: 'CyberWiz LTD',
      role: 'admin' as UserRole,
      username: 'sysadmin',
      country: 'Tanzania',
      contact: '+255 789 456 124',
      email: 'sysadmin@cyberwiz.world',
      currentPlan: 'enterprise',
      status: 'active' as UserStatus,
      avatar: '',
      avatarColor: 'primary',
      permissions: ['all'],
      joinDate: '2024-01-15'
    },

    // Analyst Users
    {
      id: 3,
      billing: 'Auto Debit',
      fullName: 'Data Analyst',
      company: 'CyberWiz LTD',
      role: 'analyst' as UserRole,
      username: 'analyst',
      country: 'Tanzania',
      contact: '+255 789 456 125',
      email: 'analyst@cyberwiz.world',
      currentPlan: 'professional',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/2.png',
      permissions: ['read', 'analyze', 'export'],
      joinDate: '2024-02-01'
    },
    {
      id: 4,
      billing: 'Auto Debit',
      fullName: 'Financial Analyst',
      company: 'CyberWiz LTD',
      role: 'analyst' as UserRole,
      username: 'fin_analyst',
      country: 'Tanzania',
      contact: '+255 789 456 126',
      email: 'financial@cyberwiz.world',
      currentPlan: 'professional',
      status: 'active' as UserStatus,
      avatar: '',
      avatarColor: 'info',
      permissions: ['read', 'analyze', 'export'],
      joinDate: '2024-02-15'
    },

    // Super Agents
    {
      id: 5,
      billing: 'Manual - Bank Transfer',
      fullName: 'John SuperAgent',
      company: 'Super Agents Network',
      role: 'super_agent' as UserRole,
      username: 'sagent_john',
      country: 'Tanzania',
      contact: '+255 712 345 678',
      email: 'sagent@cyberwiz.world',
      currentPlan: 'business',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/3.png',
      location: 'Dar es Salaam',
      zone: 'Central',
      permissions: ['manage_agents', 'view_reports', 'view_commissions'],
      kpiScore: 85,
      performanceRating: 4.2,
      joinDate: '2024-03-01'
    },
    {
      id: 6,
      billing: 'Manual - Bank Transfer',
      fullName: 'Sarah Mambo',
      company: 'City Super Agents',
      role: 'super_agent' as UserRole,
      username: 'sagent_sarah',
      country: 'Tanzania',
      contact: '+255 713 456 789',
      email: 'sarah.mambo@cyberwiz.world',
      currentPlan: 'business',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/4.png',
      location: 'Dar es Salaam',
      zone: 'Southern',
      permissions: ['manage_agents', 'view_reports', 'view_commissions'],
      kpiScore: 92,
      performanceRating: 4.5,
      joinDate: '2024-03-15'
    },
    {
      id: 7,
      billing: 'Manual - Bank Transfer',
      fullName: 'Michael Chen',
      company: 'Northern Super Agents',
      role: 'super_agent' as UserRole,
      username: 'sagent_michael',
      country: 'Tanzania',
      contact: '+255 714 567 890',
      email: 'michael.chen@cyberwiz.world',
      currentPlan: 'business',
      status: 'pending' as UserStatus,
      avatar: '',
      avatarColor: 'warning',
      location: 'Arusha',
      zone: 'Northern',
      permissions: ['manage_agents', 'view_reports', 'view_commissions'],
      kpiScore: 78,
      performanceRating: 3.8,
      joinDate: '2024-04-01'
    },

    // Franchises
    {
      id: 8,
      billing: 'Manual - Bank Transfer',
      fullName: 'Mary Franchise',
      company: 'Mary Enterprises',
      role: 'franchise' as UserRole,
      username: 'franchise_mary',
      country: 'Tanzania',
      contact: '+255 715 678 901',
      email: 'franchise@cyberwiz.world',
      currentPlan: 'business',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/5.png',
      location: 'Arusha',
      zone: 'Northern',
      permissions: ['manage_agents', 'view_commissions', 'view_customers'],
      kpiScore: 88,
      performanceRating: 4.3,
      joinDate: '2024-03-10'
    },
    {
      id: 9,
      billing: 'Manual - Bank Transfer',
      fullName: 'David Franchise',
      company: 'David Business Group',
      role: 'franchise' as UserRole,
      username: 'franchise_david',
      country: 'Tanzania',
      contact: '+255 716 789 012',
      email: 'david.franchise@cyberwiz.world',
      currentPlan: 'business',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/6.png',
      location: 'Mwanza',
      zone: 'Lake',
      permissions: ['manage_agents', 'view_commissions', 'view_customers'],
      kpiScore: 95,
      performanceRating: 4.7,
      joinDate: '2024-03-20'
    },

    // Agents (with parent relationships)
    {
      id: 10,
      billing: 'Manual - Cash',
      fullName: 'Agent Daniel',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_daniel',
      country: 'Tanzania',
      contact: '+255 717 890 123',
      email: 'agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/7.png',
      location: 'Dar es Salaam',
      zone: 'Central',
      parentId: 5, // Belongs to Super Agent John
      permissions: ['process_transactions'],
      kpiScore: 82,
      performanceRating: 4.0,
      joinDate: '2024-04-05'
    },
    {
      id: 11,
      billing: 'Manual - Cash',
      fullName: 'Agent Grace',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_grace',
      country: 'Tanzania',
      contact: '+255 718 901 234',
      email: 'grace.agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/8.png',
      location: 'Dar es Salaam',
      zone: 'Central',
      parentId: 5, // Belongs to Super Agent John
      permissions: ['process_transactions'],
      kpiScore: 91,
      performanceRating: 4.6,
      joinDate: '2024-04-10'
    },
    {
      id: 12,
      billing: 'Manual - Cash',
      fullName: 'Agent Robert',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_robert',
      country: 'Tanzania',
      contact: '+255 719 012 345',
      email: 'robert.agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'active' as UserStatus,
      avatar: '',
      avatarColor: 'success',
      location: 'Arusha',
      zone: 'Northern',
      parentId: 8, // Belongs to Franchise Mary
      permissions: ['process_transactions'],
      kpiScore: 76,
      performanceRating: 3.7,
      joinDate: '2024-04-15'
    },
    {
      id: 13,
      billing: 'Manual - Cash',
      fullName: 'Agent Linda',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_linda',
      country: 'Tanzania',
      contact: '+255 720 123 456',
      email: 'linda.agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'pending' as UserStatus,
      avatar: '/images/avatars/1.png',
      location: 'Mwanza',
      zone: 'Lake',
      parentId: 9, // Belongs to Franchise David
      permissions: ['process_transactions'],
      joinDate: '2024-04-20'
    },
    {
      id: 14,
      billing: 'Manual - Cash',
      fullName: 'Agent James',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_james',
      country: 'Tanzania',
      contact: '+255 721 234 567',
      email: 'james.agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'inactive' as UserStatus,
      avatar: '',
      avatarColor: 'error',
      location: 'Dar es Salaam',
      zone: 'Southern',
      parentId: 6, // Belongs to Super Agent Sarah
      permissions: ['process_transactions'],
      kpiScore: 65,
      performanceRating: 3.2,
      joinDate: '2024-03-25'
    },
    {
      id: 15,
      billing: 'Manual - Cash',
      fullName: 'Agent Sophia',
      company: 'Individual Agent',
      role: 'agent' as UserRole,
      username: 'agent_sophia',
      country: 'Tanzania',
      contact: '+255 722 345 678',
      email: 'sophia.agent@cyberwiz.world',
      currentPlan: 'basic',
      status: 'active' as UserStatus,
      avatar: '/images/avatars/2.png',
      location: 'Arusha',
      zone: 'Northern',
      parentId: 8, // Belongs to Franchise Mary
      permissions: ['process_transactions'],
      kpiScore: 89,
      performanceRating: 4.4,
      joinDate: '2024-04-25'
    }
  ]
}

const projectListData: ProjectListDataType[] = [
  {
    id: 1,
    hours: '18:42',
    progressValue: 78,
    totalTask: '122/240',
    progressColor: 'success',
    projectType: 'Commission Analysis',
    projectTitle: 'Q1 Commission Report',
    img: '/images/icons/project-icons/react.png'
  },
  {
    id: 2,
    hours: '20:42',
    progressValue: 92,
    totalTask: '45/48',
    progressColor: 'success',
    projectType: 'KPI Management',
    projectTitle: 'Agent Performance Dashboard',
    img: '/images/icons/project-icons/figma.png'
  },
  {
    id: 3,
    hours: '120:87',
    progressValue: 62,
    totalTask: '290/320',
    progressColor: 'primary',
    projectType: 'Transaction Analysis',
    projectTitle: 'Monthly Transaction Report',
    img: '/images/icons/project-icons/vue.png'
  },
  {
    id: 4,
    hours: '89:19',
    progressValue: 45,
    totalTask: '28/63',
    progressColor: 'warning',
    projectType: 'Zone Management',
    projectTitle: 'Regional Performance Heatmap',
    img: '/images/icons/project-icons/xamarin.png'
  },
  {
    id: 5,
    hours: '230:10',
    progressValue: 85,
    totalTask: '120/140',
    progressColor: 'success',
    projectType: 'Commission Config',
    projectTitle: 'Super Agent Commission Setup',
    img: '/images/icons/project-icons/python.png'
  }
]

// POST: Add new user
mock.onPost('/apps/users/add-user').reply(config => {
  // Get event from post data
  const user = JSON.parse(config.data).data

  const lastId = Math.max(...data.users.map(u => u.id), 0)

  user.id = lastId + 1
  user.avatar = ''
  user.avatarColor = 'primary'
  user.status = 'active'
  user.joinDate = new Date().toISOString().split('T')[0]

  // Set default permissions based on role
  const rolePermissions = {
    admin: ['all'],
    analyst: ['read', 'analyze', 'export'],
    super_agent: ['manage_agents', 'view_reports', 'view_commissions'],
    franchise: ['manage_agents', 'view_commissions', 'view_customers'],
    agent: ['process_transactions']
  }

  user.permissions = rolePermissions[user.role as UserRole] || []

  data.users.unshift(user)

  return [201, { user }]
})

// GET: DATA
mock.onGet('/apps/users/list').reply(config => {
  const { q = '', role = null, status = null, currentPlan = null } = config.params ?? ''

  const queryLowered = q.toLowerCase()

  const filteredData = data.users.filter(
    user =>
      (user.username.toLowerCase().includes(queryLowered) ||
        user.fullName.toLowerCase().includes(queryLowered) ||
        user.role.toLowerCase().includes(queryLowered) ||
        user.email.toLowerCase().includes(queryLowered) ||
        user.contact.toLowerCase().includes(queryLowered) ||
        (user.location && user.location.toLowerCase().includes(queryLowered)) ||
        (user.zone && user.zone.toLowerCase().includes(queryLowered))) &&
      user.role === (role || user.role) &&
      user.currentPlan === (currentPlan || user.currentPlan) &&
      user.status === (status || user.status)
  )

  return [
    200,
    {
      allData: data.users,
      users: filteredData,
      params: config.params,
      total: filteredData.length
    }
  ]
})

// GET: Get user by ID
mock.onGet(/\/apps\/users\/\d+/).reply(config => {
  const url = config.url || ''
  const userId = Number(url.split('/').pop())

  const user = data.users.find(u => u.id === userId)

  if (user) {
    return [200, { user }]
  } else {
    return [404, { error: 'User not found' }]
  }
})

// PUT: Update user
mock.onPut(/\/apps\/users\/\d+/).reply(config => {
  const url = config.url || ''
  const userId = Number(url.split('/').pop())
  const updateData = JSON.parse(config.data)

  const userIndex = data.users.findIndex(u => u.id === userId)

  if (userIndex !== -1) {
    data.users[userIndex] = { ...data.users[userIndex], ...updateData }

    return [200, { user: data.users[userIndex] }]
  } else {
    return [404, { error: 'User not found' }]
  }
})

// DELETE: Deletes User
mock.onDelete('/apps/users/delete').reply(config => {
  // Get user id from URL
  const userId = Number(config.data)

  const userIndex = data.users.findIndex(t => t.id === userId)
  if (userIndex !== -1) {
    data.users.splice(userIndex, 1)

    return [200, { message: 'User deleted successfully' }]
  } else {
    return [404, { error: 'User not found' }]
  }
})

// GET: Get users by role
mock.onGet('/apps/users/by-role').reply(config => {
  const { role } = config.params

  const filteredData = data.users.filter(user => user.role === role)

  return [200, filteredData]
})

// GET: Get agents by parent (super_agent or franchise)
mock.onGet('/apps/users/agents-by-parent').reply(config => {
  const { parentId } = config.params

  const filteredData = data.users.filter(user => user.role === 'agent' && user.parentId === Number(parentId))

  return [200, filteredData]
})

// GET: DATA
mock.onGet('/apps/users/project-list').reply(config => {
  const { q = '' } = config.params ?? ''

  const queryLowered = q.toLowerCase()

  const filteredData = projectListData.filter(
    user =>
      user.projectTitle.toLowerCase().includes(queryLowered) ||
      user.projectType.toLowerCase().includes(queryLowered) ||
      user.totalTask.toLowerCase().includes(queryLowered) ||
      user.hours.toLowerCase().includes(queryLowered) ||
      String(user.progressValue).toLowerCase().includes(queryLowered)
  )

  return [200, filteredData]
})

export default mock
