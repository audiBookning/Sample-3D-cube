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

For such a simple use case (a rotating cube), using the above mentionned math and svg libraries is overboard. That can be seen just the bundle size produced. So the ideal would be to use custom code for those features.

But since this is just a test code, those considerations aren't really relevant.
