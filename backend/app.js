const express = import('express');
const cors = import('cors');

const app = express();

app.use(express.json());
app.use(cors());

module.exports = app;




