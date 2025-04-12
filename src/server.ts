import app from './app';

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('TEST ENDPOINT: GET http://localhost:3000/test');


});
