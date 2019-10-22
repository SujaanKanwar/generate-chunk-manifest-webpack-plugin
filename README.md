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

## License

This library is licensed under the MIT License.