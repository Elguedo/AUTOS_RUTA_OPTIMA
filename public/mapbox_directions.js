mapboxgl.accessToken = 'pk.eyJ1IjoiZWVsZ3VlZG8iLCJhIjoiY2xocXZ3MDh3MXB4aDNwbnVvNHdtNDVtNyJ9.8AdrRQtrlH2L0XUU3bMElA';
const map = new mapboxgl.Map({
  container: 'map', // tomamos el id del div del HTML para pintar el mapa
  style: 'mapbox://style/mapbox/streets-v11', // Especifica el estilo de mapa a utilizar
 // mapbox://styles/mapbox/light-v11
  center: [-75.48861632918707, 10.39478527360292 ], // Especifica la posición inicial "CARTAGENA"
  zoom: 13 // Specify the starting zoom
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: 'metric',
  profile: 'mapbox/driving',
  alternatives: false,
  geometries: 'geojson',
  controls: { instructions: false },
  flyTo: false
});

map.addControl(directions, 'top-right');
map.scrollZoom.enable();

const clearances = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.47426, 38.06673]
      },
      properties: {
        clearance: "13' 2"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.47208, 38.06694]
      },
      properties: {
        clearance: "13' 7"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.60485, 38.12184]
      },
      properties: {
        clearance: "13' 7"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.61905, 37.87504]
      },
      properties: {
        clearance: "12' 0"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.55946, 38.30213]
      },
      properties: {
        clearance: "13' 6"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.27235, 38.04954]
      },
      properties: {
        clearance: "13' 6"
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.27264, 37.82917]
      },
      properties: {
        clearance: "11' 6"
      }
    }
  ]
};

const obstacle = turf.buffer(clearances, 0.25, { units: 'kilometers' });
let bbox = [0, 0, 0, 0];
let polygon = turf.bboxPolygon(bbox);

map.on('load', () => {
  map.addLayer({
    id: 'clearances',
    type: 'fill',
    source: {
      type: 'geojson',
      data: obstacle
    },
    layout: {},
    paint: {
      'fill-color': '#f03b20',
      'fill-opacity': 0.5,
      'fill-outline-color': '#f03b20'
    }
  });

  map.addSource('theRoute', {
    type: 'geojson',
    data: {
      type: 'Feature'
    }
  });

  map.addLayer({
    id: 'theRoute',
    type: 'line',
    source: 'theRoute',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#cccccc',
      'line-opacity': 0.5,
      'line-width': 13,
      'line-blur': 0.5
    }
  });


  map.addSource('theBox', {
    type: 'geojson',
    data: {
      type: 'Feature'
    }
  });
  map.addLayer({
    id: 'theBox',
    type: 'fill',
    source: 'theBox',
    layout: {},
    paint: {
      'fill-color': '#FFC300',
      'fill-opacity': 0.5,
      'fill-outline-color': '#FFC300'
    }
  });
});

let counter = 0;
const maxAttempts = 50;
let emoji = '';
let collision = '';
let detail = '';
const reports = document.getElementById('reports');

function addCard(id, element, clear, detail) {
  const card = document.createElement('div');
  card.className = 'card';
  
  const heading = document.createElement('div');

  heading.className =
    clear === true
      ? 'card-header route-found'
      : 'card-header obstacle-found';
  heading.innerHTML =
    id === 0
      ? `${emoji} The route ${collision}`
      : `${emoji} Route ${id} ${collision}`;

  const details = document.createElement('div');
  details.className = 'card-details';
  details.innerHTML = `This ${detail} obstacles.`;

  card.appendChild(heading);
  card.appendChild(details);
  element.insertBefore(card, element.firstChild);
}

function noRoutes(element) {
  const card = document.createElement('div');
  card.className = 'card';
 
  const heading = document.createElement('div');
  heading.className = 'card-header no-route';
  emoji = '🛑';
  heading.innerHTML = `${emoji} Ending search.`;

  
  const details = document.createElement('div');
  details.className = 'card-details';
  details.innerHTML = `No clear route found in ${counter} tries.`;

  card.appendChild(heading);
  card.appendChild(details);
  element.insertBefore(card, element.firstChild);
}

directions.on('clear', () => {
  map.setLayoutProperty('theRoute', 'visibility', 'none');
  map.setLayoutProperty('theBox', 'visibility', 'none');

  counter = 0;
  reports.innerHTML = '';
});

directions.on('route', (event) => {

  map.setLayoutProperty('theRoute', 'visibility', 'none');
  map.setLayoutProperty('theBox', 'visibility', 'none');

  if (counter >= maxAttempts) {
    noRoutes(reports);
  } else {
    
    for (const route of event.route) {
  
      map.setLayoutProperty('theRoute', 'visibility', 'visible');
      map.setLayoutProperty('theBox', 'visibility', 'visible');

      // Obtener la característica GeoJSON LineString de la ruta
      const routeLine = polyline.toGeoJSON(route.geometry);

      // Crear un cuadro delimitador alrededor de esta ruta
      
      bbox = turf.bbox(routeLine);
      polygon = turf.bboxPolygon(bbox);

      
      map.getSource('theRoute').setData(routeLine);

      
      map.getSource('theBox').setData(polygon);

      const clear = turf.booleanDisjoint(obstacle, routeLine);

      if (clear === true) {
        collision = 'does not intersect any obstacles!';
        detail = `takes ${(route.duration / 60).toFixed(
          0
        )} minutes and avoids`;
        emoji = '✔️';
        map.setPaintProperty('theRoute', 'line-color', '#74c476');
        
        map.setLayoutProperty('theBox', 'visibility', 'none');
        // Restablece el contador
        counter = 0;
      } else {
        // aumenta el conteo
        counter = counter + 1;
//A medida que aumentan los intentos, amplíe el área de búsqueda
//por un factor del recuento de intentos
        polygon = turf.transformScale(polygon, counter * 0.01);
        bbox = turf.bbox(polygon);
        collision = 'is bad.';
        detail = `takes ${(route.duration / 60).toFixed(
          0
        )} minutes and hits`;
        emoji = '⚠️';
        map.setPaintProperty('theRoute', 'line-color', '#de2d26');

        // Agregar un waypoint seleccionado aleatoriamente para obtener una nueva ruta desde la API de indicaciones
        const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
        directions.setWaypoint(
          0,
          randomWaypoint['features'][0].geometry.coordinates
        );
      }
      // Agregar una nueva sección de informe a la barra lateral
      addCard(counter, reports, clear, detail);
    }
  }
});