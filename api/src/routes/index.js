//podria vincular con fetch pero me resulta mas facil Axios
const { Router } = require('express');
const axios = require('axios'); // aca importo axios despues del npm i axios

// aca defino models y me los traigo de la BD
const { Dog, Temperament } = require('../db.js');
const {DB_API} = process.env;

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
// const dogsRouter = require('./dogs.js');
// const temperamentsRouter = require('./temperaments.js');

const router = Router();
// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//creo funciones controladores para despues invocarlas y uso funcion asincrona porque no se cuanto
// demore la respuesta, y aviso q tiene q esperar la resp para cargar la info, siempre conviene

//trabajar de manera asincrona y aca me traigo toda la info de la api
    const getApiInfo = async () => {
        const apiHtml = await axios.get('https://api.thedogapi.com/v1/breeds', {
            headers: {'x-api-key': `${DB_API}`}});           
        const apiInfo = apiHtml.data.map(p => { //creo un objeto q mapee y devuelva solo lo q necesito para mi app de la Api
        return {
            id: p.id,
            name: p.name,
            height: p.height.metric,            
            width: p.width,            
            lifespan: p.life_span,
            temperament: p.temperament,
            origin: p.origin,
            bredfor: p.bred_for,
            breedgroup: p.breed_group,
            imgid: p.image.id,
            img: p.image.url, 
            // la imagen viene en este formato
            //"reference_image_id":"BJa4kxc4X","image":{"id":"BJa4kxc4X","width":1600,"height":1199,"url":"https://cdn2.thedogapi.com/images/BJa4kxc4X.jpg"}                        
        };    
    });
    return apiInfo;
    };


// traigo la info de la base de datos
// no llamo id porque ya me lo trae automaticamente
const getDbInfo = async () => {
    return await Dog.findAll ({  //traigo la info de mi base de datos
    include:{  // ademas de todo traeme temperament 
      model: Temperament,      
      attributes: ['name'],
      through: { // va siempre en las llamadas y comprueba que llame atributo name en este caso 
          attributes: [],
      },   
    }
    })
};

// creo una funcion que me traiga todo desde la Api y La dB
const getAllDogs = async () => {
    const apiInfo = await getApiInfo();
    const dbInfo = await getDbInfo();
    const infoTotal = apiInfo.concat(dbInfo);
    return infoTotal;
};

//defino el middleware AVERIGUAR BIEN CUAL ES EL MIDLEWARE

router.get ('/dogs', async (req, res) =>{
    const name = req.query.name   //req query busca si hay un name por query
    let dogsAll = await getAllDogs();
    if (name){
        let dogsName = await dogsAll.filter(p => p.name.toLowerCase().includes(name.toLowerCase())) //tolower case hace que la busqueda en minus o mayusc no afecte al resultado de la busqueda
        dogsName.length ? //aca pregunta si hay algo
        res.status(200).send(dogsName) :
        res.status(404).send('No existe la Raza que esta buscando.');
    }else {
        res.status(200).send(dogsAll)
    }    
});

router.get('/temperament', async (req, res) => {
    const apiHtml = await axios.get('https://api.thedogapi.com/v1/breeds', {
      headers: {'x-api-key': `${DB_API}`}});      
    const temperament = apiHtml.data.map(p => p.temperament)

    const temperaments = temperament.toString().trim().split(/\s*,\s*/);
    const splittemperament = await temperaments.filter(p => p.length > 0);

    //console.log (splittemperament) //compruebo lo q trae
    
    splittemperament.forEach(p => {
        // console.log (p)
        // me traigo los temperamentos de la base de datos busca o lo crea si no existe
        if (p!==undefined) Temperament.findOrCreate({where: {name: p}})});

    const allTemperament = await Temperament.findAll();
    res.send(allTemperament);
});

router.post('/dogs', async (req, res) => {
    let {                
        name,
        height,
        weight,          
        lifespan,
        temperament,
        img,
        origin,
        dogsdb,        
        /// ** traigo lo q me pide por Body ** 
    } = req.body
    
    //console.log('************ ERROR NAME',name);

    //console.log('************ ERROR REQ BODY',req.body); el error era Defaul sin t

    let dogCreated = await Dog.create ({                          
        name,
        height,         
        weight,          
        lifespan,
        temperament,
        img,
        origin,
        dogsdb,
    })
    let temperamentDb = await Temperament.findAll({
        where: {name : temperament}
    })
    dogCreated.addTemperament(temperamentDb)
    res.send('Perro Creado Exitosamente')
});

router.get('/dogs/:id', async (req, res) => {
        const id = req.params.id;
        const dogsTotal = await getAllDogs()
        if (id){
            let dogId = await dogsTotal.filter(p => p.id == id)
            dogId.length?
            res.status(200).send(dogId) :
            res.status(404).send('no se encontro el Perro Buscado')
        }
});


module.exports = router;



// *** carga de prueba en post
// {
//     "img" : "https://estaticos.muyinteresante.es/media/cache/1140x_thumb/uploads/images/gallery/59bbb29c5bafe878503c9872/husky-siberiano-bosque.jpg",
//     "name": "Jeison",
//     "height" : "12 - 17",
//     "weight" : "15 - 20",
//     "temperament": ["Stubborn","Adventurous"]
// }

// {
//     "name": "Rodrigo",
//     "image": "https://images.unsplash.com/photo-1637545255701-ecaea910dd35?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
//     "height": "3 - 15",
//     "weight": "6 - 10",
//     "life_span": "4 - 10 years",
//     "temperament": "Intelligent",
//     "createdInDb": true
//   }

