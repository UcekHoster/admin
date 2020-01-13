const express = require('express');
const app = express();
const cors = require('cors');
const mongodb = require('mongodb');
const FileStream = require('fs');
const mongoClient = mongodb.MongoClient;
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const ejs = require('ejs');
const dotenv = require('dotenv');
dotenv.config();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
app.use(cors());

mongoose.connect(process.env.DB_SECRET_KEY, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
}, () => {
    console.log('Connected to Mongo');
});
app.get('/error', async (req, res) => {
    res.render('error', {
        header: "Internal Server Error"
    })
});
app.get('/', (req, res) => {
    const year4 = new Date().getFullYear() - 3;
    const year3 = new Date().getFullYear() - 2;
    const year2 = new Date().getFullYear() - 1;
    res.render('home', {
        year2: year2,
        year3: year3,
        year4: year4,
        header: 'Admin Panel'
    });
})
app.get('/:year', async (req, res) => {
    const year = parseInt(req.params.year);
    await mongoClient.connect(process.env.DB_SECRET_KEY, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        async (err, client) => {
            let db = client.db('mainStore')
            let collection = db.collection('storage')
            await collection.find({
                yearofJoining: year,
                autherized: 'Yes'
            }).toArray((err, data) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('holder', {
                        data: data,
                        header: `${year} - Admin Panel`
                    })
                }
            })
        })
});

app.post('/reader/:data', async (req, res) => {
    const data = req.params.data;
    await mongoClient.connect(process.env.DB_SECRET_KEY, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        async (err, client) => {
            let db = client.db('mainStore')
            let collection = db.collection('storage')
            await collection.findOne({
                nad: data
            }, (err, data) => {
                if (err) {
                    res.redirect('error', {
                        header: 'Error - Admin Panel'
                    })
                } else {

                    BUFFER = data.file.buffer
                    FileStream.writeFileSync(`${data.nad}.pdf`, BUFFER)
                    var stream = FileStream.ReadStream(`${data.nad}.pdf`)
                    var file_name = data.nad
                    res.setHeader('content-type', 'application/pdf')
                    res.setHeader('content-disposition', 'inline; filenmae ="' + file_name + '"')
                    stream.pipe(res)
                }
            })
        })
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 5000;
}
app.listen(port, () => {
    console.log(`Server started at ${port}`)
});