---
title: SSH端口转发
date: '2026-07-03 10:48'
author: 广习习
tags:
  - ssh
  - frp
  - nat
url: >-
  https://mqnu00.github.io/blog/posts/ops/ssh-port-forwarding/ssh-port-forwarding.html
---

# 背景

目前家里有一台小服务器

## 配置

| 类型   | 参数                                                      |
| ------ | --------------------------------------------------------- |
| OS     | Ubuntu 22.04.5 LTS x86_64                                 |
| Kernel | 6.8.0-124-generic                                         |
| Shell  | zsh 5.8.1                                                 |
| CPU    | Intel Celeron N3150 (4) @ 2.080GHz                        |
| Memory | 2GB * 2 DDR3 1333 MHz                                     |
| DISK   | TOSHIBA DT01ACA050 机械硬盘 500G                          |
|        | Great Wall GW600 256GB 固态硬盘 2.5寸                     |
|        | Kingchuxing 256GB M.2 SATA 固态硬盘 2230 （外接移动硬盘） |

## 网络环境

使用小区免费的网络。IP分发只有IPV4，没有IPV6。

### tailscale

由于需要外网访问，使用了tailscale，但是没有自配derp，延迟很高。

```shell
> tailscale ping 100.71.186.58
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 329ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 318ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 343ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 291ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 266ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 312ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 328ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 317ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 318ms
pong from laptop-mqnu00 (100.71.186.58) via DERP(hkg) in 311ms
direct connection not established
```

### frp

寻找免费的frp服务，只能提供一两个端口，速率也只有10M左右。

出现端口不够用的情况。

# SSH端口转发

实现效果是FRP穿透内网服务器22端口的同时，通过SSH转发服务器的其他端口，使得外网能够访问服务器的其他端口，又不用真正打通。

```shell
ssh -L 本地端口:目标地址:目标端口 -p [FRP映射的SSH端口] [用户名]@[服务器公网IP]
```

比如我输入命令：

```
ssh -L 5140:192.168.10.5:5140 -p xxxxx name@xxx.xxx.xxx.xxx
```

我电脑本地访问 127.0.0.1:5140，会被ssh进程监听捕获，转发消息到内网服务器，然后消息原封不动的发送给内网的192.168.10.5:5140。

不过整个过程是通过FRP的连接，某种程度上实现了端口复用。
