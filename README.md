# promise-img-loader
## Installation
```
yarn add promise-img-loader
```
```
import imgsLoaded from 'promise-img-loader'
```

## Usage
imgsLoaded always returns Promise. It works correctrly with strings (urls), `HTMLImageElement`, `NodeList`, `HTMLCollection` and jQuery collections. Even more – you can mix them all!
```js
imgsLoaded('image1.jpg')
imgsLoaded('image1.jpg', 'image2.jpg')
imgsLoaded('image1.jpg', ['image2.jpg', 'image3.jpg'])
// More complex example
const myImageObject = new Image
myImageObject.src = 'image4.jpg'
imgsLoaded(
    myImageObject,
    'image1.jpg',
    document.querySelector('#myimage'),
    document.querySelectorAll('.img'),
    document.getElementsByTagName('img'),
    jQuery('.myclass:even')
)
```
### Resolve
When all of the images are loaded `imgsLoaded` resolves an array of objects like `{img, state}`:
```js
imgsLoaded('image1.jpg')
.then(results => {
    console.log(results)
    // [{img: HTMLImageElement, state: "ok"}]
})
```
### Reject
It returns rejection when at least one of the images hasn't been loaded.
```js
imgsLoaded('image1.jpg', '//example.com/404', null)
.catch(({loaded, invalid}) => {
    console.log(invalid)
    // [
    // {img: '//example.com/404', state: "failed"},
    // {img: null, state: "invalid"}
    // ]
    console.log(loaded) 
    // [{img: HTMLImageElement, state: "ok"}]
    return loaded
})
.then(results => {
    console.log(results)
    // [{img: HTMLImageElement, state: "ok"}]
})
```

### Options
You can pass a plain object with options as first argument. Here is complete example:
```js
imgsLoaded({
    timeout: 1000, // Will reject each image that being loaded more than 1000ms
    onProgress(processed, total, result) {
        console.log(Math.round(processed/total*100), '%')
        if(result) { // First time it fires with 0 processed counter -> no result
            console.log(result) // {img, state}
        }
    }
}, 'image1.jpg', 'VERY_LARGE_IMAGE.jpg', '/404')
.catch(({loaded, invalid}) => {
    console.log(invalid)
    // [
    // {img: '//example.com/404', state: "failed"},
    // {img: 'VERY_LARGE_IMAGE.jpg', state: "timeout_failed"}
    // ]
    return loaded
})
.then(results => {
    results.forEach(r => {
        r.img.classList.add('loaded')
    })
})
```

## Test & Development
```
git clone https://github.com/ekorzun/promise-img-loader.git
yarn install
yarn test
```




