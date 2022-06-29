# Youkuohao Woker 


## Get started

```
npm i

node example
```

## Q&A

> 为什么生成单独的polyfill文件?

polyfill依赖了一些无法bundle的依赖包，这些依赖包要跟着cli安装。当cli安装在全局目录时，
在工作目录下运行dev依赖到polyfill，便会无法加载到依赖包（除非工作目录也安装了），所以runtime先执行，
再依赖polyfill（获取到全局目录下的路径），此时polyfill便可以依赖到依赖包。

如果polyfill实现零依赖打包，就不需要被抽离出去。

CLI会编译项目代码并让runtime去执行，执行的时候需要注册一些polyfill。
受限于node.js模块加载机制，polyfill注册的时候，依赖到的package需要安装
到项目所在路径。为了避免这个问题，不直接在runtime里注册polyfill，而是
先获取CLI下的polyfill文件路径，再require。这样polyfill依赖的package就
会从CLI路径下加载。