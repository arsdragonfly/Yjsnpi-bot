# Contributing Guidelines

Welcome! We're very glad to receive your contribution, and you don't have to be a homo to contribute! (≧Д≦) 

In order to make your pull requests merged more easily, here're a few little tips regarding the code (mostly what you'd expect from [Douglas Crockford](http://shop.oreilly.com/product/9780596517748.do)):

* Always use ```strict``` TypeScript.
* No ```new```.
* [No](https://github.com/getify/You-Dont-Know-JS/blob/master/scope%20%26%20closures/apA.md) ```this```.
* No ES6/TypeScript classes. See [here](https://www.youtube.com/watch?v=PSGEjv3Tqo0) for how to properly do OOP in JavaScript, or check out how object creation is done in [```lib/```](./lib/).
> ... Class was the most requested new feature in JavaScript, and all of the requests came from Java programmers, who have to program in JavaScript and don't want to have to learn how to do that. ... _Those people will go to their graves never knowing how miserable they are._
> 
> -- Douglas Crockford
* No prototypal inheritance. Again, see [here](https://www.youtube.com/watch?v=PSGEjv3Tqo0).
* No indexing into arrays. Yes, no ```array[index]```, because 
  1. You have a plethora of utility functions to traverse arrays: ```forEach()```, ```map()```, ```filter()```, ```reduce()```, ```find()```, etc. that makes the intention of your code way clearer.
  2. It may return ```undefined```.
  3. It may return ```undefined``` and TypeScript does the typing wrong and they [aren't](https://github.com/Microsoft/TypeScript/issues/13778) fixing it anytime soon.

  If you _really_ need to index into arrays, be sure to wrap every value with ```Option.of()```.
* No ```async```/```await```; instead, use [Fluture](https://github.com/fluture-js/Fluture)```.tryP()``` or ```.encaseP()``` to wrap up ```Promise```s and force yourself to handle every error explicitly.