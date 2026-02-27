import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { UserDataType } from '../context/types'

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthResponse {
  user: Omit<UserDataType, 'password'>
  accessToken: string
}

class AuthService {
  private readonly jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET
  private readonly jwtExpiration = process.env.NEXT_PUBLIC_JWT_EXPIRATION
  private db: Database.Database

  constructor() {
    this.db = new Database('agent360.db')
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials

    try {
      // Find user by email in SQLite database
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?')
      const user = stmt.get(email) as any

      if (!user) {
        throw new Error('User not found')
      }

      // Verify password (for now, just compare plain text)
      const isPasswordValid = password === user.password
      if (!isPasswordValid) {
        throw new Error('Invalid password')
      }

      // Generate JWT token
      const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, this.jwtSecret!, {
        expiresIn: this.jwtExpiration
      })

      // Remove password from user object
      const { password: _password, ...userWithoutPassword } = user

      return {
        user: userWithoutPassword as Omit<UserDataType, 'password'>,
        accessToken
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Invalid email or password')
    }
  }

  async getUserById(id: number): Promise<Omit<UserDataType, 'password'> | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?')
      const user = stmt.get(id) as any

      if (!user) {
        return null
      }

      // Remove password from user object
      const { password: _password, ...userWithoutPassword } = user

      return userWithoutPassword as Omit<UserDataType, 'password'>
    } catch (error) {
      console.error('Get user error:', error)

      return null
    }
  }

  async verifyToken(token: string): Promise<Omit<UserDataType, 'password'> | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret!) as { id: number }

      return await this.getUserById(decoded.id)
    } catch (error) {
      console.error('Token verification error:', error)

      return null
    }
  }

  async createDefaultUsers(): Promise<void> {
    try {
      // Check if users already exist
      const existingUsers = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

      if (existingUsers.count > 0) {
        console.log('Users already exist, skipping default user creation')

        return
      }

      // Insert default users
      const insertUser = this.db.prepare(`
        INSERT INTO users (email, password, full_name, username, role, permissions, location, zone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const defaultUsers = [
        ['admin@cyberwiz.world', 'admin', 'Nicky Miles', 'ennexica', 'admin', '["all"]', 'Dar es Salaam', 'Central', 1],
        [
          'analyst@cyberwiz.world',
          'analyst',
          'Data Analyst',
          'analyst',
          'analyst',
          '["read", "analyze", "export"]',
          'Dar es Salaam',
          'Central',
          1
        ],
        [
          'sagent@cyberwiz.world',
          'sagent',
          'Super Agent John',
          'sagent_john',
          'super_agent',
          '["manage_agents", "view_reports", "view_commissions"]',
          'Dar es Salaam',
          'Central',
          1
        ],
        [
          'franchise@cyberwiz.world',
          'franchise',
          'Franchise Mary',
          'franchise_mary',
          'franchise',
          '["manage_agents", "view_commissions", "view_customers"]',
          'Arusha',
          'Northern',
          1
        ]
      ]

      const transaction = this.db.transaction(() => {
        for (const user of defaultUsers) {
          insertUser.run(...user)
        }
      })

      transaction()
      console.log('Default users created successfully')
    } catch (error) {
      console.error('Error creating default users:', error)
    }
  }
}

export const authService = new AuthService()
export default authService
