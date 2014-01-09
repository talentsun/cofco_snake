#中粮贪食蛇游戏项目

##使用说明
需要使用nodejs和相关的开发工具才能启动服务，不过public当中有导出的所有静态文件

###工程结构：
```
cofco_snake
├── app.js 测试服务代码
├── images 图片素材
├── public 所有的静态文件
│   ├── css
│   ├── fonts
│   ├── images
│   ├── js
│   ├── json
│   ├── desktop.html 由templates/desktop.hbs编译生成的静态html文件
│   └── mobile.html 由templates/mobile.hbs编译生成的静态html文件
├── src 游戏代码
└── templates 服务使用的页面模板
    ├── desktop.hbs
    └── mobile.hbs
```


##开发
具体的搭建步骤：
* 安装nodejs，clone代码库
```bash
	git clone https://github.com/jiarvis/cofco_snake
```

* 安装bower，less和grunt
```bash
	npm install -g bower lessc grunt-cli
```

* 安装依赖
```bash
	npm install
	bower install
```

* 运行测试服务
```bash
	node app.js 
```

* 访问http://localhost:3000

##导出静态文件:

```bash
grunt templates #导出html文件
grunt sprite    #导出图片
grunt less      #导出css文件
grunt           #导出到吗
```

其他功能详见Gruntfile.js
