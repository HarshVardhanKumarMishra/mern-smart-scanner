const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config.js'); 
const authRoutes = require('./routes/auth.routes.js');
const healthRoutes = require('./routes/health.routes.js'); 
const path = require('path');
const documentRoutes = require('./routes/document.routes.js');

dotenv.config();

connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes); 
app.use('/api/auth', authRoutes);  
app.use('/api/documents', documentRoutes);
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created missing uploads directory"); 
}

app.use('/uploads', express.static(uploadDir));  

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});