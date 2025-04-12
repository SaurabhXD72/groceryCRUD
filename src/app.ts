import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from'./routes/authRoutes';
import groceryRoutes from './routes/groceryRoutes';
import orderRoutes from './routes/orderRoute';
import userRoutes from './routes/userRoutes';
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For parsing form data

app.use('/auth', authRoutes);
app.use('/admin/groceries', groceryRoutes );
app.use('/orders',orderRoutes);
app.use('/user',userRoutes);
app.use('/test', )
app.get('/', (req, res) => {
    res.send('API is up n runnin!');
});




export default app;

