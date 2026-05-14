---
title: "从零搭建 Kubernetes 集群 (ARM64 Linux 离线版)"
description: "在 ARM64 架构的离线 Linux 服务器上从零搭建生产级 Kubernetes 集群，使用本地源完成 kubeadm 高可用部署。"
pubDate: 2026-05-14
updatedDate: 2026-05-14
tags: ["Kubernetes", "K8s", "ARM64", "离线部署", "容器编排", "DevOps"]
pinned: false
---

# 从零搭建 Kubernetes 集群 (ARM64 Linux 离线版)

本文将详细介绍如何在**无外网访问**的 ARM64 架构 Linux 服务器上从零搭建 Kubernetes 集群，包括离线资源准备、本地源配置、节点配置、集群初始化和高可用部署等完整流程。

## 为什么选择离线部署？

离线部署在内网环境、安全要求高的场景中非常重要：

- **安全性** — 避免外部网络攻击
- **合规性** — 满足等保、金融等行业要求
- **稳定性** — 不受外网波动影响
- **可控性** — 完全掌控软件版本和来源

## 环境准备

### 硬件要求

**最小配置：**
- **控制节点 (Control Plane)**：2 核 CPU, 4GB RAM, 50GB 磁盘
- **工作节点 (Worker Node)**：2 核 CPU, 4GB RAM, 50GB 磁盘
- **跳板机/资源机**（可选）：4 核 CPU, 8GB RAM, 200GB 磁盘（用于下载离线包）

**推荐配置（生产环境）：**
- **控制节点**：4 核 CPU, 8GB RAM, 100GB 磁盘
- **工作节点**：4 核 CPU, 16GB RAM, 200GB 磁盘

### 软件要求

- **操作系统**：Ubuntu 22.04 LTS / Debian 11+ / Rocky Linux 9+ (ARM64)
- **内核版本**：5.15+
- **Kubernetes 版本**：v1.28+
- **容器运行时**：containerd 1.6+

### 网络规划

```
节点角色        IP 地址           主机名
─────────────────────────────────────────
Control Plane   192.168.1.100     k8s-master-01
Worker Node 1   192.168.1.101     k8s-worker-01
Worker Node 2   192.168.1.102     k8s-worker-02
跳板机/资源机   192.168.1.200     k8s-jump-host  (可上网)
```

## 第一步：离线资源准备（在有网的机器上）

### 1.1 准备环境

```bash
# 在可以上网的机器上执行
mkdir -p /k8s-offline/{packages,images,certs}
cd /k8s-offline
```

### 1.2 下载 Kubernetes 组件

```bash
# 下载 kubeadm, kubelet, kubectl (ARM64)
VERSION=1.28.0
ARCH=arm64

# 方法 1：从 k8s 官方下载
wget https://pkgs.k8s.io/core:/stable:/v${VERSION}/deb/pool/main/k/kubeadm/kubeadm_${VERSION}-00_arm64.deb
wget https://pkgs.k8s.io/core:/stable:/v${VERSION}/deb/pool/main/k/kubelet/kubelet_${VERSION}-00_arm64.deb
wget https://pkgs.k8s.io/core:/stable:/v${VERSION}/deb/pool/main/k/kubectl/kubectl_${VERSION}-00_arm64.deb

# 方法 2：使用 apt download（推荐）
sudo apt update
sudo apt download kubeadm=${VERSION}-00 kubelet=${VERSION}-00 kubectl=${VERSION}-00

# 下载依赖包
sudo apt download -d --no-install kubeadm=${VERSION}-00 kubelet=${VERSION}-00 kubectl=${VERSION}-00

# 移动到离线目录
sudo cp /var/cache/apt/archives/*.deb ./packages/
```

### 1.3 下载容器运行时

```bash
# 下载 containerd 及其依赖
sudo apt download -d --no-install containerd.io

# 或者手动下载
wget https://github.com/containerd/containerd/releases/download/v1.6.22/containerd-1.6.22-linux-arm64.tar.gz

# 移动所有 deb 包
sudo cp /var/cache/apt/archives/*.deb ./packages/
```

### 1.4 下载 CNI 网络插件

```bash
# 下载 Calico YAML 文件（离线部署需要）
wget https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml -O calico-operator.yaml
wget https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml -O calico-config.yaml

# 或者下载 Flannel
wget https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml -O flannel.yaml

# 下载所需镜像（需要预先 pull）
# 注意：这些镜像需要在有 Docker 的环境中 pull
docker pull calico/operator:v1.30.3
docker pull calico/node:v3.26.1
docker pull calico/cni:v3.26.1
docker pull calico/kube-controllers:v3.26.1
docker pull calico/pod2daemon-flexvol:v3.26.1

# 导出镜像
docker save calico/operator:v1.30.3 -o calico-operator.tar
docker save calico/node:v3.26.1 -o calico-node.tar
docker save calico/cni:v3.26.1 -o calico-cni.tar
docker save calico/kube-controllers:v3.26.1 -o calico-kube-controllers.tar
docker save calico/pod2daemon-flexvol:v3.26.1 -o calico-pod2daemon-flexvol.tar
```

### 1.5 打包离线资源

```bash
# 创建离线安装包
cd /k8s-offline
tar -czvf k8s-offline-packages.tar.gz \
    packages/ \
    calico-operator.yaml \
    calico-config.yaml \
    *.tar

# 传输到离线服务器
# 方法 1：使用 USB 盘
cp k8s-offline-packages.tar.gz /media/usb/

# 方法 2：使用 scp（如果跳板机能访问内网）
scp k8s-offline-packages.tar.gz root@192.168.1.100:/root/
```

## 第二步：离线环境配置（在所有节点上）

### 2.1 系统初始化

```bash
# 更新系统（如果有本地源）
sudo apt update && sudo apt upgrade -y

# 安装必要工具（离线）
cd /root/k8s-offline/packages
sudo dpkg -i apt-transport-https*.deb ca-certificates*.deb curl*.deb gnupg*.deb lsb-release*.deb

# 禁用交换分区（Kubernetes 要求）
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 配置主机名和 hosts
sudo hostnamectl set-hostname k8s-master-01  # 根据实际节点修改
echo "192.168.1.100 k8s-master-01" | sudo tee -a /etc/hosts
echo "192.168.1.101 k8s-worker-01" | sudo tee -a /etc/hosts
echo "192.168.1.102 k8s-worker-02" | sudo tee -a /etc/hosts
```

### 2.2 配置内核参数

```bash
# 加载必要的内核模块
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置所需的 sysctl 参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 应用配置
sudo sysctl --system
```

### 2.3 安装容器运行时（离线）

```bash
# 安装 containerd 依赖
cd /root/k8s-offline/packages
sudo dpkg -i libseccomp2*.deb runc*.deb containerd.io*.deb

# 或者使用 tar 包安装
tar -xzf containerd-1.6.22-linux-arm64.tar.gz -C /usr/local
sudo ln -s /usr/local/bin/containerd /usr/local/bin/
sudo ln -s /usr/local/bin/ctr /usr/local/bin/
sudo ln -s /usr/local/bin/containerd-shim-runc-v2 /usr/local/bin/

# 配置 containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# 修改 sysctl 配置以支持 overlay
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml

# 创建 systemd 服务
cat <<EOF | sudo tee /etc/systemd/system/containerd.service
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd
Restart=always
RestartSec=5
Delegate=yes
KillMode=process
OOMScoreAdjust=-999
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity

[Install]
WantedBy=multi-user.target
EOF

# 启动 containerd
sudo systemctl daemon-reload
sudo systemctl enable containerd
sudo systemctl restart containerd
```

### 2.4 安装 Kubernetes 组件（离线）

```bash
# 安装 kubeadm, kubelet, kubectl
cd /root/k8s-offline/packages
sudo dpkg -i kubelet*.deb kubeadm*.deb kubectl*.deb

# 如果有依赖问题，安装所有包
sudo dpkg -i *.deb

# 验证安装
kubeadm version
kubelet version
kubectl version --client

# 锁定版本（防止误升级）
sudo apt-mark hold kubeadm kubelet kubectl
```

## 第三步：初始化 Control Plane（离线）

### 3.1 在控制节点上执行

```bash
# 初始化集群（使用本地 CRI socket）
sudo kubeadm init \
    --apiserver-advertise-address=192.168.1.100 \
    --pod-network-cidr=10.244.0.0/16 \
    --cri-socket=unix:///var/run/containerd/containerd.sock \
    --ignore-preflight-errors=Swap,CRI

# 保存 join 命令（后续需要在 worker 节点执行）
# 输出示例：
# kubeadm join 192.168.1.100:6443 --token <token> \
#     --discovery-token-ca-cert-hash sha256:<hash>
```

### 3.2 配置 kubectl

```bash
# 创建 .kube 目录
mkdir -p $HOME/.kube

# 复制配置文件
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 验证集群状态
kubectl get nodes
# 输出：NAME            STATUS     ROLES           AGE   VERSION
#       k8s-master-01   NotReady   control-plane   2m    v1.28.0
```

### 3.3 导入 CNI 镜像（离线）

```bash
# 导入 Calico 镜像
cd /root/k8s-offline
sudo ctr -n k8s.io images import calico-operator.tar
sudo ctr -n k8s.io images import calico-node.tar
sudo ctr -n k8s.io images import calico-cni.tar
sudo ctr -n k8s.io images import calico-kube-controllers.tar
sudo ctr -n k8s.io images import calico-pod2daemon-flexvol.tar

# 验证镜像
sudo ctr -n k8s.io images ls | grep calico
```

### 3.4 安装 CNI 网络插件（离线）

```bash
# 应用 Calico 配置（使用本地文件）
kubectl apply -f /root/k8s-offline/calico-operator.yaml
kubectl apply -f /root/k8s-offline/calico-config.yaml

# 或者使用 Flannel
# kubectl apply -f /root/k8s-offline/flannel.yaml
```

### 3.5 验证节点状态

```bash
# 等待节点就绪（约 2-3 分钟）
watch kubectl get nodes

# 输出：
# NAME            STATUS   ROLES           AGE   VERSION
# k8s-master-01   Ready    control-plane   5m    v1.28.0
```

## 第四步：加入 Worker 节点（离线）

### 4.1 在 Worker 节点上安装组件

```bash
# 在所有 worker 节点上执行相同的安装步骤
# 参考第二步：离线环境配置

# 安装 containerd
cd /root/k8s-offline/packages
sudo dpkg -i containerd.io*.deb
sudo systemctl enable containerd
sudo systemctl restart containerd

# 安装 kubernetes 组件
sudo dpkg -i kubelet*.deb kubeadm*.deb kubectl*.deb
```

### 4.2 导入必要镜像

```bash
# 在 worker 节点上导入 Calico 镜像
cd /root/k8s-offline
sudo ctr -n k8s.io images import calico-node.tar
sudo ctr -n k8s.io images import calico-cni.tar
sudo ctr -n k8s.io images import calico-pod2daemon-flexvol.tar
```

### 4.3 加入集群

```bash
# 在 k8s-worker-01 和 k8s-worker-02 上分别执行
sudo kubeadm join 192.168.1.100:6443 \
    --token <token> \
    --discovery-token-ca-cert-hash sha256:<hash>
```

### 4.4 验证集群

```bash
# 在控制节点上查看所有节点
kubectl get nodes -o wide

# 输出：
# NAME            STATUS   ROLES           AGE   VERSION   INTERNAL-IP    OS-IMAGE             KERNEL-VERSION    CONTAINER-RUNTIME
# k8s-master-01   Ready    control-plane   10m   v1.28.0   192.168.1.100 Ubuntu 22.04.3 LTS   5.15.0-91-generic   containerd://1.6.22
# k8s-worker-01   Ready    <none>          5m    v1.28.0   192.168.1.101 Ubuntu 22.04.3 LTS   5.15.0-91-generic   containerd://1.6.22
# k8s-worker-02   Ready    <none>          3m    v1.28.0   192.168.1.102 Ubuntu 22.04.3 LTS   5.15.0-91-generic   containerd://1.6.22
```

## 第五步：部署测试应用（离线）

### 5.1 准备应用镜像

```bash
# 在有网的机器上下载 nginx 镜像
docker pull nginx:alpine
docker save nginx:alpine -o nginx-alpine.tar

# 传输到 k8s 集群
scp nginx-alpine.tar root@192.168.1.100:/root/

# 在所有节点上导入镜像
sudo ctr -n k8s.io images import nginx-alpine.tar
```

### 5.2 部署 Nginx

```bash
# 创建 nginx 部署
kubectl create deployment nginx --image=nginx:alpine --replicas=3

# 创建服务
kubectl expose deployment nginx --type=NodePort --port=80 --target-port=80

# 查看部署状态
kubectl get pods -o wide
kubectl get svc
```

### 5.3 验证服务

```bash
# 测试服务访问
curl http://192.168.1.100:<NodePort>

# 查看 Pod 日志
kubectl logs -l app=nginx

# 进入 Pod 容器
kubectl exec -it <pod-name> -- /bin/sh
```

## 第六步：离线安装常用工具

### 6.1 安装 Helm（离线）

```bash
# 在有网的机器上下载 Helm
wget https://get.helm.sh/helm-v3.12.0-linux-arm64.tar.gz
tar -xzf helm-v3.12.0-linux-arm64.tar.gz
cp linux-arm64/helm /tmp/

# 传输到离线服务器
scp /tmp/helm root@192.168.1.100:/usr/local/bin/

# 在所有节点上安装
sudo chmod +x /usr/local/bin/helm
helm version
```

### 6.2 安装 k9s（离线）

```bash
# 在有网的机器上下载 k9s
wget https://github.com/derailed/k9s/releases/download/v0.30.9/k9s_Linux_arm64.tar.gz
tar -xzf k9s_Linux_arm64.tar.gz
cp k9s /tmp/

# 传输到离线服务器
scp /tmp/k9s root@192.168.1.100:/usr/local/bin/

# 在所有节点上安装
sudo chmod +x /usr/local/bin/k9s
k9s version
```

### 6.3 部署 Portainer（离线）

```bash
# 在有网的机器上下载 Portainer 镜像
helm repo add portainer https://portainer.github.io/k8s
helm pull portainer/portainer --version 1.8.0
tar -xzf portainer-1.8.0.tgz

# 导出所需镜像
docker pull portainer/agent:2.19.0
docker pull portainer/kube-state-metrics:2.8.0
docker save portainer/agent:2.19.0 -o portainer-agent.tar
docker save portainer/kube-state-metrics:2.8.0 -o portainer-kube-state-metrics.tar

# 传输到离线环境
scp portainer/ root@192.168.1.100:/root/
scp portainer-*.tar root@192.168.1.100:/root/

# 在离线环境导入镜像并部署
sudo ctr -n k8s.io images import portainer-agent.tar
sudo ctr -n k8s.io images import portainer-kube-state-metrics.tar

kubectl create namespace portainer
cd /root/portainer/portainer
kubectl apply -f templates/
```

## 常见问题排查

### 问题 1: dpkg 依赖错误

```bash
# 错误：dpkg: 处理包 xxx 时出错：依赖问题
# 解决：按顺序安装所有依赖包

cd /root/k8s-offline/packages
# 先安装基础依赖
sudo dpkg -i lib*.*.deb
# 再安装运行时
sudo dpkg -i runc*.deb
# 最后安装主包
sudo dpkg -i containerd.io*.deb

# 或者使用 --force-depends（不推荐）
sudo dpkg -i --force-depends package.deb
```

### 问题 2: 节点状态为 NotReady

```bash
# 查看 kubelet 日志
sudo journalctl -u kubelet -f

# 查看容器状态
sudo crictl ps -a

# 检查 CRI socket
ls -la /var/run/containerd/containerd.sock

# 检查镜像是否导入
sudo ctr -n k8s.io images ls
```

### 问题 3: Pod 镜像拉取失败

```bash
# 错误：ImagePullBackOff / ErrImagePull
# 原因：离线环境没有镜像

# 解决：确保镜像已导入所有节点
# 在控制节点检查
sudo ctr -n k8s.io images ls

# 在 worker 节点导入
sudo ctr -n k8s.io images import <image>.tar

# 重启 pod
kubectl delete pod <pod-name>
```

### 问题 4: CNI 插件失败

```bash
# 检查 Calico 状态
kubectl get pods -n kube-system | grep calico

# 查看 Calico 日志
kubectl logs -n kube-system <calico-pod>

# 检查镜像是否导入
sudo ctr -n k8s.io images ls | grep calico
```

## 离线镜像管理最佳实践

### 7.1 镜像清单管理

```bash
# 创建镜像清单文件
cat <<EOF > image-list.txt
nginx:alpine
calico/operator:v1.30.3
calico/node:v3.26.1
calico/cni:v3.26.1
calico/kube-controllers:v3.26.1
calico/pod2daemon-flexvol:v3.26.1
EOF

# 批量导出镜像
while read image; do
    docker save "$image" -o "${image//\//_}.tar"
done < image-list.txt

# 批量导入镜像
for img in *.tar; do
    sudo ctr -n k8s.io images import "$img"
done
```

### 7.2 本地镜像仓库（可选）

```bash
# 在有网的机器上搭建本地 Harbor 或 registry
docker run -d -p 5000:5000 --name registry registry:2

# 重新标记镜像
docker tag nginx:alpine 192.168.1.200:5000/nginx:alpine
docker push 192.168.1.200:5000/nginx:alpine

# 在 k8s 中配置 insecureRegistry
cat <<EOF | sudo tee /etc/containerd/config.toml | grep -A5 hosts
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs."192.168.1.200:5000".tls]
    insecure_skip_verify = true
EOF
```

## 高可用集群扩展

### 8.1 添加第二个 Control Plane（离线）

```bash
# 在第一个控制节点上获取控制平面 join 命令
sudo kubeadm token create --print-join-command --control-plane

# 在第二个控制节点上执行相同的安装步骤后加入
sudo <join-command>
```

### 8.2 部署 HA Proxy（离线）

```bash
# 在有网的机器上下载 HA Proxy
sudo apt download -d --no-install haproxy
scp /var/cache/apt/archives/haproxy*.deb root@192.168.1.200:/tmp/

# 在所有控制节点前部署 HA Proxy
cd /tmp
sudo dpkg -i haproxy*.deb

cat <<EOF > /etc/haproxy/haproxy.cfg
global
    log /dev/log local0
    maxconn 256

defaults
    log global
    mode tcp
    option dontlognull
    timeout connect 5000
    timeout client 50000
    timeout server 50000

frontend kubernetes-api
    bind *:6443
    default_backend kubernetes-api-servers

backend kubernetes-api-servers
    balance roundrobin
    server k8s-master-01 192.168.1.100:6443 check
    server k8s-master-02 192.168.1.103:6443 check
EOF

sudo systemctl enable haproxy
sudo systemctl restart haproxy
```

## 总结

通过以上步骤，我们成功在**完全离线**的 ARM64 架构 Linux 服务器上搭建了一个完整的 Kubernetes 集群。

### 技术栈总结

| 组件 | 版本 | 说明 | 离线方式 |
|------|------|------|----------|
| 操作系统 | Ubuntu 22.04 LTS | ARM64 架构 | - |
| Kubernetes | v1.28.0 | 容器编排平台 | deb 包离线安装 |
| 容器运行时 | containerd 1.6.22 | 容器运行时 | tar 包/deb 包 |
| 网络插件 | Calico v3.26.1 | CNI 网络 | YAML + 镜像导入 |
| 包管理器 | Helm v3.12 | K8s 包管理 | 二进制分发 |

### 核心步骤回顾

1. ✅ **离线资源准备** — 在有网机器下载所有包和镜像
2. ✅ **传输离线包** — 使用 USB 或跳板机传输
3. ✅ **系统初始化** — 配置内核参数，禁用 Swap
4. ✅ **离线安装运行时** — containerd 离线安装
5. ✅ **离线安装 K8s** — deb 包离线安装
6. ✅ **初始化 Control Plane** — kubeadm init
7. ✅ **导入 CNI 镜像** — 离线导入 Calico 镜像
8. ✅ **安装网络插件** — 本地 YAML 文件
9. ✅ **加入 Worker 节点** — kubeadm join
10. ✅ **部署测试应用** — 离线镜像导入

### 离线部署关键点

- **镜像管理** — 提前规划所需镜像清单
- **依赖处理** — 使用 `apt download -d` 获取完整依赖
- **版本锁定** — 确保所有节点版本一致
- **本地源** — 可选配置本地 apt 源加速部署
- **文档记录** — 记录所有版本号和配置参数

### 下一步优化

- [ ] 配置本地 apt 源（apt-ftparchive）
- [ ] 部署本地镜像仓库（Harbor/registry）
- [ ] 配置持久化存储（Local Path Provisioner）
- [ ] 部署 Ingress Controller（Nginx Ingress）
- [ ] 设置监控告警（Prometheus + Grafana 离线版）
- [ ] 实现备份恢复（Velero 离线配置）
- [ ] 配置 GitLab CI 离线流水线

### 离线资源清单模板

```bash
# 保存此清单用于未来部署
K8s 版本：v1.28.0
架构：arm64
日期：2026-05-14

必需包:
- kubeadm_1.28.0-00_arm64.deb
- kubelet_1.28.0-00_arm64.deb
- kubectl_1.28.0-00_arm64.deb
- containerd.io_1.6.22_arm64.deb

必需镜像:
- calico/operator:v1.30.3
- calico/node:v3.26.1
- calico/cni:v3.26.1
- calico/kube-controllers:v3.26.1
- calico/pod2daemon-flexvol:v3.26.1
- nginx:alpine (测试用)
```

---

**更新时间**: 2026-05-14  
**阅读时间**: 20 分钟  
**适用场景**: 内网环境、等保要求、金融系统、离线服务器、ARM64 架构
