import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false // Disable bodyParser for file uploads
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }

    // Check if this is a multipart form (file upload) or JSON
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle profile picture upload
      return handleProfilePictureUpload(req, res, decoded.id)
    } else {
      // Handle JSON data
      return handleJsonUpdate(req, res, decoded.id)
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function handleProfilePictureUpload(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB limit
      filename: (name, ext, part) => {
        // Generate unique filename
        return `avatar-${userId}-${Date.now()}${ext}`
      }
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = files.avatar || files.profilePicture
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Get the uploaded file path
    const filePath = file[0].filepath
    const fileName = path.basename(filePath)
    const publicUrl = `/uploads/avatars/${fileName}`

    // Update user avatar in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: publicUrl,
        updatedAt: new Date()
      }
    })

    return res.status(200).json({
      message: 'Profile picture updated successfully',
      avatar: publicUrl
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)

    return res.status(500).json({ message: 'Failed to upload profile picture' })
  }
}

async function handleJsonUpdate(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    // Parse JSON body
    const buffers = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }
    const data = JSON.parse(Buffer.concat(buffers).toString())
    const { type, data: formData } = data

    if (type === 'profile') {
      // Update profile information
      const { firstName, lastName, email, organization, number, address, state, zipCode, country, language, timezone } =
        formData

      const fullName = `${firstName} ${lastName}`.trim()

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          email,
          location: state,
          phoneNumber: number,
          address,
          zipCode,
          updatedAt: new Date()
        }
      })

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          location: updatedUser.location,
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address,
          zipCode: updatedUser.zipCode
        }
      })
    } else if (type === 'password') {
      // Change password
      const { currentPassword, newPassword } = formData

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' })
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      return res.status(200).json({ message: 'Password changed successfully' })
    } else if (type === 'profilePicture') {
      // Handle base64 image
      const { avatar } = formData

      if (avatar && avatar.startsWith('data:image')) {
        // Convert base64 to file
        const base64Data = avatar.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        const fileName = `avatar-${userId}-${Date.now()}.png`
        const filePath = path.join(uploadDir, fileName)

        fs.writeFileSync(filePath, buffer)

        const publicUrl = `/uploads/avatars/${fileName}`

        await prisma.user.update({
          where: { id: userId },
          data: {
            avatar: publicUrl,
            updatedAt: new Date()
          }
        })

        return res.status(200).json({
          message: 'Profile picture updated successfully',
          avatar: publicUrl
        })
      }
    }

    return res.status(400).json({ message: 'Invalid update type' })
  } catch (error) {
    console.error('JSON update error:', error)

    return res.status(500).json({ message: 'Internal server error' })
  }
}
