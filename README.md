# Rotating cube sample code in a svg tag

Uses

- [@math.gl/core](https://github.com/uber-web/math.gl) for the maths
  > A 3D/WebGL math library
- [@svgdotjs/svg.js](https://github.com/svgdotjs/svg.js) for ease of manipulating the svg.
  > The lightweight library for manipulating and animating SVG
- [Parcel](https://github.com/parcel-bundler/parcel) for the build
  > The zero configuration build tool for the web.

## Script

`npm run parcel` to start the demo at http://localhost:1234/

## Notes

For such a simple use case (a rotating cube), using the above mentionned math and svg libraries is overboard. That can be seen just by the bundle size produced. So the ideal would be to use custom code for those features.

But since this is just a test/draf/prototype code to try to understand the technology, those considerations aren't really that relevant.

As in everything else there is still much to be done.

- The types are too complex and unreadable

- The methods are all over the place. Ineherience and composition needed.

- etc

Some things aren't very logical and are there only to try to test the performance differences.
