Generate Chunk Manifest Plugin
=========================

This webpack plugin is an extension plugin for
[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) to generate
webpack's chunk manifest files that is written as links to the HTML page.


This plugin requires [webpack](http://webpack.github.io/) v4.0.0 and above.


Installation
-----
```shell
$ npm install generate-chunk-manifest-webpack-plugin --save-dev
```

## Usage

You have to add this plugin to your webpack configuration. 

```javascript
// webpack.config.js

const GenerateChunkManifestPlugin = require("generate-chunk-manifest-webpack-plugin");

module.exports = {
  //...
  plugins: [
    // new HTMLWebpackPlugin(),  // HTMLWebpackPlugin should come before
    //...
    new GenerateChunkManifestPlugin({
        packageName: "MyWindowUniqueName"
	})
  
  ]
  //.....
}

```
## 2.0.0

Adds support for webpack 5.x and html-weback-plugin > 4.x


## 1.1.0

Adds support for prefetch and preload with webpack

For webpack prefetch and preload refer https://webpack.js.org/guides/code-splitting/#prefetchingpreloading-modules

## License

This library is licensed under the MIT License.
