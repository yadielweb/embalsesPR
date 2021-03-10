let mymap; 
let siteDict = {};

///////////////////////////////////
// Funcion para inicializar el mapa
///////////////////////////////////

function inicializaMapa()
{
  let centro = [18.25178,-66.254513]; 
  mymap = L.map('mapid').setView(centro, 9);
  let atrib1 = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">';
  let atrib2 = 'OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
  let atrib  = atrib1 + atrib2;
  let mytoken = 'pk.eyJ1IjoibWVjb2JpIiwiYSI6IjU4YzVlOGQ2YjEzYjE3NTcxOTExZTI2OWY3Y2Y1ZGYxIn0.LUg7xQhGH2uf3zA57szCyw';
  let myLayer = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
  L.tileLayer(myLayer, {
        attribution: atrib,
        maxZoom: 24,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mytoken}).addTo(mymap);   
}

////////////////////////////////////////////////////////////////////
// Funcion la cual crea un diccionario con los datos de los embalses
////////////////////////////////////////////////////////////////////

function createDictionary()
{
  let url ="https://raw.githubusercontent.com/mecobi/archivos_ejemplo/main/embalses.csv";
  
  Plotly.d3.csv(url,function(data){
    for(let i=0;i < data.length;i++)
    {
      siteDict[data[i].siteID] = {nombre:data[i].nombre,
                                  lat:data[i].latitude,
                                  lon:data[i].longitude,
                                  desborde:data[i].desborde,
                                  seguridad:data[i].seguridad,
                                  observacion:data[i].observacion,
                                  ajuste:data[i].ajuste,
                                  control:data[i].control};
    }
  });
}

//////////////////////////////////////////////////////////////////////////
// Funcion para filtrar la fecha y nivel de los embalses en el diccionario
//////////////////////////////////////////////////////////////////////////

function filtraDatos(data)
{
  let fecha = [],
      nivel = [];
  
  const filtered = data.split('\n');
  let colNivel;
  
  for(let i=0;i < filtered.length;i++)
  {
    if (filtered[i].slice(0,9) == "agency_cd")
    {
      let header = filtered[i].split("\t");
      colNivel = header.findIndex(element => element.includes("_62616"))
    }
    
    if(filtered[i].slice(0,4) == "USGS")
    {
      let fila = filtered[i].split('\t');
      fecha.push(fila[2]);
      nivel.push(parseFloat(fila[colNivel]));
    }
  }
  return [fecha,nivel];
}

////////////////////////////////////////////////////////
// Funcion que devuelve la normalizacion de los embalses
////////////////////////////////////////////////////////

function normalizacion(nivel, control, desborde)
{
  let num = nivel - control,
      denominado = desborde - control,
      normalizacion = (num/denominado);
  return normalizacion;
}

//////////////////////////////////////////////////////////
// Funcion que devuelve el nivel pendiente de los embalses
//////////////////////////////////////////////////////////

function tendencia(fecha, nivel)
{
  let now = Date().slice(8,10),
      tendencia =[];
  
  for(let i=0;i < nivel.length;i++)
  {
    if (fecha[i].slice(8,10) == now)
    {
      tendencia.push(parseFloat(nivel[i]));
    }
  }
  let pendiente = tendencia[tendencia.length -1] - tendencia[0];
  return pendiente; 
}

////////////////////////////////////////////////
// Funcion que crea marcadores para cada embalse
////////////////////////////////////////////////

function createMarker(miEmbalse)
{
  Plotly.d3.text("https://waterdata.usgs.gov/pr/nwis/uv/?format=rdb&site_no=" + miEmbalse, function(data){
    let datos = filtraDatos(data),
        lat = siteDict[miEmbalse].lat,
        lon = siteDict[miEmbalse].lon,
        nombre = siteDict[miEmbalse].nombre,
        desborde = parseFloat(siteDict[miEmbalse].desborde),
        seguridad = parseFloat(siteDict[miEmbalse].seguridad),
        observacion = parseFloat(siteDict[miEmbalse].observacion),
        ajuste = parseFloat(siteDict[miEmbalse].ajuste),
        control = parseFloat(siteDict[miEmbalse].control),
        nivel = datos[1].pop(),
        nivel_pend = datos[1], 
        fecha = datos[0],
        norm = normalizacion(nivel,control,desborde),
        pendiente = tendencia(fecha, nivel_pend),
        mensaje = "Sup..soy " + nombre + " <br> Mi nivel es " + parseFloat(nivel).toFixed(2) + " metros",
        nivel_2 = 0.09 - (norm/09).toFixed(2),
        largo = 0.04,
        rect1, rect2, rect3, rect4, rect5,
        icono, marcadorIcono, marcadorTend;
    
    if (nivel_2.toFixed(2) == 0.00){largo = 0.00;}
    rect5 = L.rectangle([[lat,lon], [lat-nivel_2.toFixed(2),lon-largo]],
                             {color: 'black',
                              colorOpacity:1,
                              fillColor:'black',
                              fillOpacity:1}).addTo(mymap);
    
    if (nivel >= seguridad)
    {
      rect1 = L.rectangle([[lat,lon], [lat-0.09,lon-0.04]],
                             {color: 'black',
                              colorOpacity:1,
                              fillColor:'green',
                              fillOpacity:1}).addTo(mymap);
    }
    else if (nivel >= observacion && nivel < seguridad)
    {
      rect2 = L.rectangle([[lat,lon], [lat-0.09,lon-0.04]],
                             {color: 'black',
                              colorOpacity:1,
                              fillColor:'blue',
                              fillOpacity:1}).addTo(mymap);
    }
    else if (nivel >= ajuste && nivel < observacion)
    {
      rect3 = L.rectangle([[lat,lon], [lat-0.09,lon-0.04]],
                             {color: 'black',
                              colorOpacity:1,
                              fillColor:'yellow',
                              fillOpacity:1}).addTo(mymap);
    }
    else if (nivel <= control)
    {
      rect4 = L.rectangle([[lat,lon], [lat-0.09,lon-0.04]],
                             {color: 'black',
                              colorOpacity:1,
                              fillColor:'darkorange',
                              fillOpacity:1}).addTo(mymap);
    }
    rect5.bindPopup(mensaje).openPopup();
    
    if(pendiente > 0)
    {icono= 'https://cdn0.iconfinder.com/data/icons/flat-round-arrow-arrow-head/512/Green_Arrow_Top-512.png?raw=true';}
    else if(pendiente == 0)
    {icono= 'https://cdn0.iconfinder.com/data/icons/ui-essence/32/_26ui-512.png?raw=true';}
    else if(pendiente < 0)
    {icono= 'https://cdn0.iconfinder.com/data/icons/flat-round-arrow-arrow-head/512/Red_Arrow_Down-512.png?raw=true';}
    
    marcadorIcono = L.icon({iconUrl: icono, iconSize: [25,25], iconAnchor: [23.5,35]});
    marcadorTend = L.marker([lat,lon], {icon: marcadorIcono}).addTo(mymap);
  });
}

//////////////////////////////
// Funcion que imprime el mapa
//////////////////////////////

function procesaEmbalse(){
  for(const [key,value] of Object.entries(siteDict))
  {
    createMarker(key);
  }
}

createDictionary();
inicializaMapa();
setTimeout(procesaEmbalse,500);