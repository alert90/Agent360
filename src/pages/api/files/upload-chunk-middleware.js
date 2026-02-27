// Custom middleware to handle large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase body size limit for file uploads
    }
  }
}

export default function handler(req, res) {
  res.status(404).json({ message: 'Not found' })
}
