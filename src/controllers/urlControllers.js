const urlModel = require('../model/urlModel')
const shortId = require('shortid')
//........................................redis.................................................
const redis = require("redis")
const redisClient = redis.createClient({
    username: '*****',
    password: '*****',
    socket: {
        host: '*****',
        port: 12025
    }
});
redisClient.connect()
redisClient.on('connect', function (err) {
    console.log('connected to redis successfully!');
})
redisClient.on('error', (error) => {
    console.log('Redis connection error :', error);
    return
})
const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
//...........................................................create short url...................................................

const createUrl = async function (req, res) {
    try {
        const data = req.body
        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "please input some data in body" }) }
        const { urlCode, longUrl } = data
        if (!isValid(longUrl) && !isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "data required" })
        }
        if (!(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(longUrl))) {
            return res.status(400).send({ status: false, message: "Invalid LongURL" })

        }

        const isUrlCode = await urlModel.findOne({ urlCode: data.urlCode })
        if (isUrlCode) {
            res.status(404).send({ status: false, message: "Use New Url Code" })
            return
        }
        let getCacheData = await redisClient.get(`${urlCode}`, longUrl)

        if (getCacheData) {
            respons = JSON.parse(getCacheData)
            return res.status(201).send({ status: true, data: respons })
        }
        let urlPresent = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (urlPresent) {
            res.status(200).send({ status: true, data: urlPresent })
            return
        }
        const baseUrl = "http://localhost:3000"
        const shortUrlCode = shortId.generate()
        const shortUrl = baseUrl + '/' + shortUrlCode
        let result =
        {
            longUrl: longUrl,
            shortUrl: shortUrl,
            urlCode: urlCode
        }
        const createUrl = await urlModel.create(result)
        await redisClient.set(`${urlCode}`, JSON.stringify(result))
        return res.status(201).send({ status: true, data: result })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//..............................................get by params.....................................
const getUrl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        if (!isValid(urlCode)) { return res.status(400).send({ status: false, message: "urlCode required" }) }
        let cahcedUrlCode = await redisClient.get(urlCode)
        if (cahcedUrlCode) {
            const parseCachedata = JSON.parse(cahcedUrlCode)
            console.log("cache")
            return res.status(302).redirect(parseCachedata.longUrl)
        }
        const url = await urlModel.findOne({ urlCode: urlCode })
        if (url) {
            console.log("db")
            let result = {
                longUrl: url.longUrl,
                shortUrl: url.shortUrl,
                urlCode: url.urlCode
            }
            await redisClient.set(urlCode, JSON.stringify(result))
            return res.status(302).redirect(url.longUrl)
        }
        else {
            return res.status(404).send({ status: false, message: "No such URL FOUND" })
        }
    } catch (err) {
        return res.status(500).send({ status: true, message: err.message })
    }
}

module.exports.createUrl = createUrl
module.exports.getUrl = getUrl




