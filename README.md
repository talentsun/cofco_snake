#中粮贪食蛇游戏项目

##使用说明
需要使用nodejs和相关的开发工具才能启动测试服务
目录结构介绍：
project
+--templates html模板（模板里只用到了少量的debug条件分支）
   +--mobile.hbs 移动版的html模板
   +--desktop.hbs pc版的html模板
+--public 游戏所需的静态文件
   +--css
   +--js
   +--images
   +--fonts
   +--json
   +--mobile.html
   +--desktop.html
+--images 游戏会用的图片素材
+--src 主要的js代码


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
