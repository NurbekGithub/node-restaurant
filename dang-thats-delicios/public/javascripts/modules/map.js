import axios from "axios";
import { $ } from "./bling";

const DEFAULT_LNG = 71.4703558;
const DEFAULT_LAT = 51.1605227;

const mapOptions = {
  center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  zoom: 12
}

function loadPlaces(map, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if(!places.length) {
        alert('There is no such place')
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      const InfoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({map, position});
        marker.place = place;
        return marker;
      })

      markers.forEach(marker => marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `
        InfoWindow.setContent(html);
        InfoWindow.open(map, this);
      }))

      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    })
}

function makeMap(mapDiv) {
  if(!mapDiv) return;

  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('.map .autocomplete__input');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    place.geometry && loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng())
  })
}

export default makeMap;
