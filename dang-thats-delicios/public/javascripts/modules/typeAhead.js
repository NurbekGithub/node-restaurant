import axios from 'axios';
import { sanitize } from "dompurify";

function searchResultHTML(stores) {
  return stores.map(store => 
    `
      <a href="/store/${store.slug}" class='search__result'>
        <b>${store.name}</b>
      </a>
    `
  ).join('')
}

function typeAhead(search) {
  if(!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResult = search.querySelector('.search__results');

  searchInput.on('input', function() {
    // if there is no value
    if(!this.value) {
      searchResult.style.display = 'none';
      return; //stop
    }

    searchResult.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if(res.data.length) {
          searchResult.innerHTML = sanitize(searchResultHTML(res.data))
          return;
        }
        // tell them that nothing came back;
        searchResult.innerHTML = sanitize(`<div class="search__result">No result for ${this.value} found!</div>`)
      })
      .catch(err => {
        console.error(err);
      })
  })

  // handle keyboard stroke
  searchInput.on('keyup', e => {
    if(![40, 38, 13].includes(e.keyCode)) {
      return ; //nah
    }
    const activeClass = 'search__result--active';
    const current = searchResult.querySelector(`.${activeClass}`);
    const items = searchResult.querySelectorAll('.search__result');
    let next;
    if(e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if(e.keyCode === 40) {
      next = items[0]
    } else if(e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if(e.keyCode === 38 ) {
      next = items[items.length -1 ];
    } else if(e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }
    current && current.classList.remove(activeClass);
    next.classList.add(activeClass);
  })
}

export default typeAhead;