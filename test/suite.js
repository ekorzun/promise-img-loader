import assert from 'assert'
import loadImages from '../src'


const img1 = 'https://images.unsplash.com/photo-1459666644539-a9755287d6b0?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=279b60ab483a2610d1e7260dc213898c&auto=format&fit=crop&w=800&q=60'
const img2 = 'https://images.unsplash.com/photo-1474436799594-1974f1add7ad?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=2b0739606036e0f6451af38f71bf91aa&auto=format&fit=crop&w=700&q=60'
const img3 = 'https://images.unsplash.com/photo-1506701234424-ef06760d8c8e?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=936e1dfe17a85554008d1fe1995f055a&auto=format&fit=crop&w=700&q=60'
const img404 = 'https://images.pexels.com/'

require('browser-env')(['window', 'document', 'Image', 'HTMLImageElement', 'HTMLCollection', 'NodeList'], {
  resources: 'usable',
});

// 404 img hack for browser env
console.oldError = console.error;
console.error = function (args) {
  if (args.indexOf('Could not load img') > -1) { return false }
  console.oldError.apply(console, arguments)
}


describe(`Hello, world :)`, () => {

  const $document = require('jquery')(window.document)

  it(`should return a promise on error`, () =>
    assert.equal(loadImages().catch(e => e) instanceof Promise, true)
  )

  it(`should return a promise on success`, () =>
    assert.equal(loadImages(img1) instanceof Promise, true)
  )

  it(`should return error if no arguments passed`, () =>
    loadImages().catch(r => {
      assert.equal(r.error instanceof Error, true)
    })
  )

  it(`should return error if not valid arguments passed`, () =>
    Promise.all([
      loadImages(1).catch(r => r),
      loadImages(true).catch(r => r),
      loadImages(window).catch(r => r),
    ]).then(results => {
      results.forEach(r => {
        r.invalid.forEach(r => {
          assert.equal(r.error instanceof Error, true)
        })
      })
    })
  )


  it(`should load 1 image from url`, () =>
    loadImages(img1)
      .then(r => {
        assert.equal(r.length, 1)
        assert.equal(r[0].img.src, img1)
      })
  )

  it(`should load several images from url`, () =>
    loadImages(img1, img2, img3)
      .then(r => {
        assert.equal(r.length, 3)
      })
  )

  it(`should fail if at least one of images is broken`, () =>
    loadImages(img1, img404, img3, img404, undefined, true, img2)
      .catch(({ loaded, invalid }) => {
        assert.equal(loaded.length, 3)
        assert.equal(invalid.length, 4)
      })
  )


  it(`should load image from HTMLImageElement (src added before call)`, () => {
    const img = new Image
    img.src = img1
    return loadImages(img).then(results => {
      assert.equal(results.length, 1)
    })
  })

  it(`should load several images from HTMLImageElement (src added after call)`, () => {
    const i1 = new Image
    const i2 = new Image
    const p = loadImages(i1, i2).then(results => {
      assert.equal(results.length, 2)
    })
    setTimeout(_ => {
      i1.src = img1
      i2.src = img2
    }, 100)
    return p
  })

  it(`should load several images from DOM (NodeList)`, () => {
    const imgs = [img1, img2, img3].map((i, index) => {
      const img = document.createElement('img')
      img.id = `i${index}`
      document.body.appendChild(img)
      img.src = i
    })
    return loadImages(document.querySelectorAll('img')).then(results => {
      assert.equal(results.length, 3)
    })
  })

  it(`should load several images from DOM (HTMLCollection)`, () => {
    const imgs = [img1, img2, img3].map((i, index) => {
      const img = document.createElement('img')
      img.id = `img${index}`
      img.classList.add('img')
      document.body.appendChild(img)
      img.src = i
    })
    return loadImages(document.getElementsByTagName('img')).then(results => {
      assert.equal(results.length, 6) // 3 + 3 from prev step
    })
  })

  it(`should load several images from DOM (jQueryCollection)`, () => {
    return loadImages($document.find('img')).then(results => {
      assert.equal(results.length, 6)
    })
  })

  it(`should load any type of arguments`, () => {
    return loadImages(
      img1,                               // 1
      [img2, img3],                       // 2
      document.querySelector('#i1'),      // 1
      document.querySelectorAll('.img'),  // 3
    ).then(results => {
      assert.equal(results.length, 7)
    })
  })


  it(`should load any type of arguments (with 404 and invalid)`, () => {
    return loadImages(
      img1,                               // 1
      [img2, img3],                       // 2
      document.querySelector('#i1'),      // 1
      document.querySelectorAll('.img'),  // 3
      [img404, null],
      123123123,
      false,
      true,
    ).catch(({ loaded, invalid }) => {
      assert.equal(loaded.length, 7)
      assert.equal(invalid.length, 5)
    })
  })


  it(`should fail by timeout (1ms)`, () =>
    loadImages({ timeout: 1 }, img1)
      .catch(({ loaded, invalid }) => {
        assert.equal(invalid.length, 1)
      })
  )


  it(`should not fail by timeout (100000ms)`, () =>
    loadImages({ timeout: 100000 }, img1)
      .catch(({ loaded, invalid }) => {
        assert.equal(invalid.length, 1)
      })
  )

  it(`should call onProgress callback`, () => {
    let counter = 0
    return loadImages({
      onProgress: (processed, total, res) => {
        // window.console.log('Processed: ', Math.round(processed/total*100), '%', res && res.state)
        assert.equal(processed, counter++)
      }
    },
      img1,                               // 1
      [img2, img3],                       // 2
      document.querySelector('#i1'),      // 1
      document.querySelectorAll('.img'),  // 3
      [img404, null],
      123123123,
      false,
      true,
    ).catch(({ loaded, invalid }) => {
      assert.equal(loaded.length, 7)
      assert.equal(invalid.length, 5)
    })
  })

})