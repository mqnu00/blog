---
title: 最近开发时遇到的问题(var和async)
date: 2025-12-26 17:16
author: 广习习
tags: [ie8, 语法, 兼容]
---

# 环境

注意环境是ie8，常用的现代浏览器的语法是没有的，比如：

- let，const([es6开始支持](https://www.w3schools.com/JS/js_let.asp?utm_source=copilot.com))。只能使用 `var`
- [promise](https://www.w3schools.com/Js/js_es6.asp)，[async/await](https://www.w3schools.com/Js/js_2017.asp)。转而使用`function callback`

# var存在的问题

```js
// 正常写法
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var i =", i), 0);
}
```
但是循环内定义的函数不是马上执行的，当这个函数被调用时，`i` 已经等于 `imgList.length` 了。
使用 `let` 就不会出现这个问题。
根本原因是作用域的问题，`var`会自动提到全局变量，可以尝试在for循环结束后打印`i`

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var i =", i), 0);
}
console.log(i);
```
目前是使用IIFE，创建新的函数作用域，冻结变量。

```js
// IIFE写法
for (var i = 0; i < 3; i++) {
  (function(iCopy) {
    setTimeout(() => console.log("IIFE i =", iCopy), 0);
  })(i);
}
```

# 异步问题

无法使用 promise，async/await，如何保证网络请求后，我将结果赋值给变量，另一个地方用到这个变量是在请求后呢？
可以使用callback。

```js
function ajaxGET(url, params, callback) {
    $.ajax({
        url: url,
        type: "GET",
        data: params,
        dataType: "json",
        success: function (res) {
            callback(res);
        },
        error: function (err) {
            console.error("GET 请求失败:", err);
        }
    });
}
```

问题在于希望一个请求的结果，解析处理后作为另一个请求的参数，就有先后顺序，导致出现了复杂的嵌套。
还是有点头疼的。

```js
ajaxGET(url1, params1, function (res1) {
    var params2 = solve1(res1);
    ajaxGET(url2, params2, function (res2) {
        // ......
    })
})
```

# 总结

语法不习惯是一方面，保证ie8和现代浏览器网页的显示行为一致又是一个难点。

最近看了一圈jquery和extjs，没看到查看大图的组件。

尝试写个demo，就发现事件监听、图像DOM的属性等等的，ie8和现代浏览器不一致的问题。