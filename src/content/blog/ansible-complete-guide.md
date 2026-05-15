---
title: Ansible 自动化运维完整指南
description: 从零掌握 Ansible 自动化运维工具，涵盖基础概念、Playbook 编写、角色管理、最佳实践和高级应用。
pubDate: 2026-05-14
updatedDate: 2026-05-14
tags:
  - Ansible
  - DevOps
pinned: false
---

# Ansible 自动化运维完整指南

本文将全面介绍 Ansible 自动化运维工具，从基础概念到高级应用，帮助你构建高效、可维护的基础设施自动化体系。

## 为什么选择 Ansible？

### 配置管理工具对比

| 工具 | 架构 | Agent | 学习曲线 | 适用场景 |
|------|------|-------|----------|----------|
| **Ansible** | Push | 无需 | 低 | 快速部署、简单运维 |
| Puppet | Pull | 需要 | 高 | 大型复杂环境 |
| Chef | Pull | 需要 | 高 | 企业级配置管理 |
| SaltStack | Push/Pull | 可选 | 中 | 高性能需求 |

### Ansible 的核心优势

- **无代理架构** — 通过 SSH 连接，无需安装 Agent
- **简单易学** — YAML 语法，直观易懂
- **幂等性** — 多次执行结果一致
- **丰富模块** — 3000+ 内置模块
- **社区活跃** — 大量社区角色和插件
- **双向通信** — 支持 ad-hoc 命令和 Playbook

## 核心概念

### 1. 控制节点 (Control Node)

运行 Ansible 的机器，可以是任何 Linux/Mac 系统。

```bash
# 安装 Ansible
sudo apt update
sudo apt install ansible

# 验证安装
ansible --version
```

### 2. 管理主机 (Managed Nodes)

被 Ansible 管理的目标服务器。

**要求：**
- 安装 OpenSSH Server
- 与控制节点网络可达
- 支持 SSH 密钥认证（推荐）

### 3. 库存 (Inventory)

定义被管理主机的配置文件。

**静态库存示例：**

```ini
# /etc/ansible/hosts 或 inventory.ini

[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu
web2 ansible_host=192.168.1.11 ansible_user=ubuntu

[dbservers]
db1 ansible_host=192.168.1.20 ansible_user=root
db2 ansible_host=192.168.1.21 ansible_user=root

[loadbalancers]
lb1 ansible_host=192.168.1.5 ansible_user=admin

# 组合组
[web:children]
webservers
loadbalancers

# 变量定义
[webservers:vars]
http_port=80
max_clients=200

# 所有服务器
[all:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

**动态库存示例（JSON 格式）：**

```json
{
  "webservers": {
    "hosts": ["web1.example.com", "web2.example.com"],
    "vars": {
      "http_port": 80
    }
  },
  "dbservers": {
    "hosts": ["db1.example.com", "db2.example.com"],
    "vars": {
      "db_port": 3306
    }
  }
}
```

### 4. 模块 (Modules)

Ansible 的基本执行单元，完成特定任务。

**常用模块：**

| 模块 | 用途 | 示例 |
|------|------|------|
| `command` | 执行命令 | `command: /usr/bin/uptime` |
| `shell` | Shell 命令 | `shell: ls -la \| grep log` |
| `copy` | 复制文件 | `copy: src=/local/file dest=/remote/file` |
| `template` | 模板渲染 | `template: src=config.j2 dest=/etc/app.conf` |
| `yum`/`apt` | 包管理 | `yum: name=nginx state=present` |
| `service` | 服务管理 | `service: name=nginx state=started` |
| `user` | 用户管理 | `user: name=app useradd=yes` |
| `file` | 文件管理 | `file: path=/var/log/app state=directory` |
| `git` | Git 操作 | `git: repo=URL dest=/app version=main` |
| `debug` | 调试输出 | `debug: msg="Hello"` |

### 5. Playbook

YAML 格式的任务清单，定义自动化流程。

```yaml
---
- name: 配置 Web 服务器
  hosts: webservers
  become: yes  # 使用 sudo
  vars:
    nginx_version: "1.24"
    
  tasks:
    - name: 安装 Nginx
      apt:
        name: nginx
        state: present
        update_cache: yes
    
    - name: 启动 Nginx 服务
      service:
        name: nginx
        state: started
        enabled: yes
    
    - name: 复制配置文件
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: 重启 Nginx
      
  handlers:
    - name: 重启 Nginx
      service:
        name: nginx
        state: restarted
```

## 快速开始

### 1. 配置 SSH 免密登录

```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t ed25519 -C "ansible@control"

# 复制公钥到目标主机
ssh-copy-id ubuntu@192.168.1.10
ssh-copy-id ubuntu@192.168.1.11

# 测试连接
ssh ubuntu@192.168.1.10
```

### 2. 创建库存文件

```bash
# 创建目录结构
mkdir -p ~/ansible/{inventory,playbooks,roles,templates}

# 创建 inventory.ini
cat > ~/ansible/inventory.ini << 'EOF'
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu
web2 ansible_host=192.168.1.11 ansible_user=ubuntu

[webservers:vars]
ansible_python_interpreter=/usr/bin/python3
EOF
```

### 3. 测试连接

```bash
# Ping 所有主机
ansible all -i inventory.ini -m ping

# 输出示例：
# web1 | SUCCESS => { "ping": "pong" }
# web2 | SUCCESS => { "ping": "pong" }
```

### 4. 执行 Ad-hoc 命令

```bash
# 检查系统信息
ansible all -i inventory.ini -m setup -a 'filter=ansible_facts'

# 执行命令
ansible webservers -i inventory.ini -m command -a 'uptime'

# 安装软件包
ansible all -i inventory.ini -m apt -a 'name=htop state=present'

# 复制文件
ansible webservers -i inventory.ini -m copy -a 'src=/local/file.txt dest=/tmp/file.txt'

# 管理服务
ansible all -i inventory.ini -m service -a 'name=nginx state=restarted'
```

## Playbook 深入

### 1. 基本结构

```yaml
---
- name: Play 名称
  hosts: 目标主机组
  become: true  # 是否提权
  become_method: sudo  # 提权方式
  vars_files:
    - vars/main.yml  # 外部变量文件
  vars:
    var1: value1  # 内联变量
  environment:  # 环境变量
    KEY1: value1
  connection: ssh  # 连接方式
  serial: 10%  # 分批执行
  max_fail_percentage: 10  # 最大失败百分比
  
  pre_tasks:  # 前置任务
    - name: 前置任务
      debug:
        msg: "准备开始"
  
  roles:  # 应用角色
    - common
    - nginx
    
  tasks:  # 任务列表
    - name: 任务名称
      module: 参数
      
  post_tasks:  # 后置任务
    - name: 后置任务
      debug:
        msg: "完成"
  
  handlers:  # 处理器
    - name: 处理器名称
      service:
        name: nginx
        state: restarted
```

### 2. 变量管理

**变量优先级（低到高）：**

1. 角色默认变量 (`defaults/main.yml`)
2. 角色变量 (`vars/main.yml`)
3. Playbook 变量 (`vars:`)
4. 库存变量 (`group_vars/`, `host_vars/`)
5. 额外变量 (`-e` 参数)

**变量文件示例：**

```yaml
# group_vars/webservers.yml
http_port: 80
max_clients: 200
nginx_worker_processes: auto
nginx_worker_connections: 1024

# host_vars/web1.yml
http_port: 8080
custom_domain: "web1.example.com"

# vars/app_config.yml
app_name: "myapp"
app_version: "1.0.0"
app_port: 3000
```

**在 Playbook 中使用：**

```yaml
- name: 使用变量
  debug:
    msg: "应用 {{ app_name }} 版本 {{ app_version }}"
```

### 3. 条件执行

```yaml
- name: 条件安装
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - mysql-server
  when: install_nginx | bool

- name: 检查操作系统
  debug:
    msg: "这是 Ubuntu 系统"
  when: ansible_os_family == "Debian"

- name: 检查变量存在
  debug:
    msg: "变量已定义"
  when: my_var is defined

- name: 复杂条件
  debug:
    msg: "生产环境且需要 SSL"
  when: environment == "production" and ssl_enabled | bool
```

### 4. 循环处理

```yaml
- name: 安装多个软件包
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - mysql-server
    - php

- name: 创建多个用户
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
    shell: /bin/bash
  loop:
    - { name: 'user1', groups: 'developers' }
    - { name: 'user2', groups: 'admins' }

- name: 从文件读取列表
  debug:
    msg: "{{ item }}"
  loop: "{{ lookup('file', 'packages.txt').split('\n') }}"

- name: 嵌套循环
  debug:
    msg: "{{ item.key }} = {{ item.value }}"
  loop: "{{ my_dict | dict2items }}"
```

### 5. 错误处理

```yaml
- name: 可能失败的任务
  command: /usr/bin/risky-command
  ignore_errors: yes  # 忽略错误继续执行

- name: 带重试的任务
  command: /usr/bin/flaky-command
  retries: 5
  delay: 10
  until: last_rc == 0

- name: 失败时执行
  block:
    - name: 任务 1
      command: /usr/bin/task1
    - name: 任务 2
      command: /usr/bin/task2
  rescue:
    - name: 错误处理
      debug:
        msg: "任务失败，执行恢复操作"
  always:
    - name: 始终执行
      debug:
        msg: "无论成功失败都执行"
```

### 6. 模板渲染 (Jinja2)

**模板文件示例 (nginx.conf.j2)：**

```jinja2
user www-data;
worker_processes {{ nginx_worker_processes | default('auto') }};
pid /run/nginx.pid;

events {
    worker_connections {{ nginx_worker_connections | default(1024) }};
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    {% for server in virtual_hosts %}
    server {
        listen {{ server.port | default(80) }};
        server_name {{ server.domain }};
        root {{ server.root | default('/var/www/html') }};
        
        {% if server.ssl_enabled | default(false) %}
        ssl on;
        ssl_certificate {{ server.ssl_cert }};
        ssl_key {{ server.ssl_key }};
        {% endif %}
        
        location / {
            try_files $uri $uri/ =404;
        }
    }
    {% endfor %}
}
```

**Playbook 中使用：**

```yaml
- name: 渲染配置文件
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    owner: root
    group: root
    mode: '0644'
    backup: yes  # 备份原文件
    validate: 'nginx -t -c %s'  # 验证语法
  notify: 重启 Nginx
```

## 角色 (Roles)

### 1. 角色结构

```
roles/
└── nginx/
    ├── defaults/
    │   └── main.yml          # 默认变量（优先级最低）
    ├── vars/
    │   └── main.yml          # 角色变量
    ├── files/                # 静态文件
    │   └── custom.conf
    ├── templates/            # Jinja2 模板
    │   └── nginx.conf.j2
    ├── handlers/
    │   └── main.yml          # 处理器
    ├── tasks/
    │   ├── main.yml          # 主任务
    │   ├── install.yml       # 安装任务
    │   └── configure.yml     # 配置任务
    ├── meta/
    │   └── main.yml          # 元数据（依赖等）
    └── README.md
```

### 2. 创建角色

```bash
# 使用 ansible-galaxy 创建角色结构
ansible-galaxy init nginx

# 或手动创建
mkdir -p roles/nginx/{tasks,handlers,templates,files,vars,defaults}
```

### 3. 角色内容示例

**defaults/main.yml：**

```yaml
---
nginx_version: "1.24"
nginx_state: present
nginx_enabled: true
nginx_listen_port: 80
nginx_worker_processes: "auto"
nginx_worker_connections: 1024
```

**tasks/main.yml：**

```yaml
---
- name: 包含安装任务
  include_tasks: install.yml

- name: 包含配置任务
  include_tasks: configure.yml

- name: 确保 Nginx 运行
  service:
    name: nginx
    state: "{{ 'started' if nginx_enabled else 'stopped' }}"
    enabled: "{{ nginx_enabled | bool }}"
  notify: 重启 Nginx
```

**tasks/install.yml：**

```yaml
---
- name: 安装 Nginx (Debian)
  apt:
    name: "nginx={{ nginx_version }}"
    state: "{{ nginx_state }}"
    update_cache: yes
  when: ansible_os_family == "Debian"

- name: 安装 Nginx (RHEL)
  yum:
    name: "nginx-{{ nginx_version }}"
    state: "{{ nginx_state }}"
  when: ansible_os_family == "RedHat"
```

**handlers/main.yml：**

```yaml
---
- name: 重启 Nginx
  service:
    name: nginx
    state: restarted

- name: 重载 Nginx
  service:
    name: nginx
    state: reloaded
```

**meta/main.yml：**

```yaml
---
dependencies:
  - role: common
    tags: ['common']
  
  - role:
    name: firewall
    when: enable_firewall | default(false)
```

### 4. 使用角色

```yaml
---
- name: 部署 Web 服务器
  hosts: webservers
  become: yes
  
  roles:
    - role: common
      tags: ['common']
      
    - role: nginx
      nginx_listen_port: 8080  # 覆盖默认变量
      tags: ['web']
      
    - role: monitoring
      when: enable_monitoring | default(false)
```

## 高级特性

### 1. 自定义模块

**Python 模块示例 (modules/custom_facts.py)：**

```python
#!/usr/bin/env python
ANSIBLE_METADATA = {
    'metadata_version': '1.1',
    'status': ['preview'],
    'supported_by': 'community'
}

DOCUMENTATION = '''
---
module: custom_facts
short_description: 收集自定义系统信息
version_added: "1.0"
options:
    check_disk:
        description: 是否检查磁盘空间
        required: false
        type: bool
        default: true
'''

EXAMPLES = '''
- name: 收集自定义 facts
  custom_facts:
    check_disk: yes
'''

RETURN = '''
ansible_facts:
    description: 返回自定义 facts
    type: dict
'''

from ansible.module_utils.basic import AnsibleModule

def main():
    module = AnsibleModule(
        argument_spec=dict(
            check_disk=dict(type='bool', default=True)
        )
    )
    
    facts = {}
    
    if module.params['check_disk']:
        import os
        disk_usage = os.statvfs('/')
        total = disk_usage.f_frsize * disk_usage.f_blocks
        free = disk_usage.f_frsize * disk_usage.f_bfree
        facts['disk_total'] = total
        facts['disk_free'] = free
        facts['disk_percent_used'] = ((total - free) / total) * 100
    
    module.exit_json(changed=False, ansible_facts=facts)

if __name__ == '__main__':
    main()
```

**使用自定义模块：**

```yaml
- name: 收集自定义 facts
  custom_facts:
    check_disk: yes
    
- name: 显示磁盘使用率
  debug:
    msg: "磁盘使用率：{{ disk_percent_used | round(2) }}%"
  when: disk_percent_used > 80
```

### 2. 自定义插件

**Filter 插件示例 (filter_plugins/custom_filters.py)：**

```python
def to_bytes(size_mb):
    """将 MB 转换为字节"""
    return size_mb * 1024 * 1024

def truncate_middle(text, length=50):
    """截断文本中间部分"""
    if len(text) <= length:
        return text
    half = length // 2
    return text[:half] + "..." + text[-half:]

class FilterModule(object):
    def filters(self):
        return {
            'to_bytes': to_bytes,
            'truncate_middle': truncate_middle
        }
```

**使用自定义过滤器：**

```yaml
- name: 使用自定义过滤器
  debug:
    msg: "{{ 100 | to_bytes }}"
    
- name: 截断长文本
  debug:
    msg: "{{ long_text | truncate_middle(30) }}"
```

### 3. 动态库存

**AWS EC2 动态库存脚本示例：**

```python
#!/usr/bin/env python3
import boto3
import json
import sys

def get_inventory():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:Environment', 'Values': ['Production']}
        ]
    )
    
    inventory = {
        'webservers': {'hosts': [], 'vars': {}},
        'dbservers': {'hosts': [], 'vars': {}},
        '_meta': {'hostvars': {}}
    }
    
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            if instance['State']['Name'] != 'running':
                continue
                
            hostname = instance['Tags'][0]['Value']
            ip = instance['PrivateIpAddress']
            instance_type = instance['InstanceType']
            
            # 根据标签分组
            for tag in instance.get('Tags', []):
                if tag['Key'] == 'Role':
                    if tag['Value'] in inventory:
                        inventory[tag['Value']]['hosts'].append(hostname)
                        inventory['_meta']['hostvars'][hostname] = {
                            'ansible_host': ip,
                            'ansible_user': 'ubuntu',
                            'instance_type': instance_type
                        }
    
    return inventory

if __name__ == '__main__':
    if sys.argv[1] == '--list':
        print(json.dumps(get_inventory()))
    elif sys.argv[1] == '--host':
        print(json.dumps({}))
```

### 4. 异步任务和轮询

```yaml
- name: 执行长时间任务
  async: 3600  # 最多运行 1 小时
  poll: 0      # 不等待，立即返回
  command: /usr/bin/long-running-script.sh
  register: async_result

- name: 检查任务状态
  async_status:
    jid: "{{ async_result.ansible_job_id }}"
  register: job_status
  until: job_status.finished
  retries: 30
  delay: 10

- name: 显示结果
  debug:
    msg: "{{ job_status.results }}"
  when: job_status.finished
```

### 5. 策略 (Strategies)

```yaml
- name: 使用不同策略
  hosts: all
  strategy: linear  # 默认，同步执行
  
  # 其他策略选项:
  # - free: 主机独立执行，不等待
  # - host_pinned: 类似 free，但保持主机顺序
  
  tasks:
    - name: 任务 1
      debug:
        msg: "任务 1"
    
    - name: 任务 2
      debug:
        msg: "任务 2"
```

### 6. 滚动更新

```yaml
- name: 滚动更新 Web 服务
  hosts: webservers
  serial: 1  # 每次只更新一台
  
  tasks:
    - name: 从负载均衡移除
      uri:
        url: "http://lb-api/remove/{{ inventory_hostname }}"
        method: POST
      delegate_to: localhost
      
    - name: 停止服务
      service:
        name: myapp
        state: stopped
        
    - name: 部署新版本
      git:
        repo: https://github.com/app/repo.git
        dest: /opt/myapp
        version: "{{ app_version }}"
        
    - name: 启动服务
      service:
        name: myapp
        state: started
        
    - name: 健康检查
      uri:
        url: "http://localhost:8080/health"
        status_code: 200
      register: health_result
      retries: 5
      delay: 10
      until: health_result.status == 200
      
    - name: 添加回负载均衡
      uri:
        url: "http://lb-api/add/{{ inventory_hostname }}"
        method: POST
      delegate_to: localhost
      when: health_result.status == 200
```

## 最佳实践

### 1. 项目结构

```
ansible-project/
├── inventory/
│   ├── production/
│   │   ├── hosts
│   │   ├── group_vars/
│   │   │   ├── all.yml
│   │   │   └── webservers.yml
│   │   └── host_vars/
│   └── staging/
├── group_vars/
│   ├── all.yml
│   └── webservers.yml
├── host_vars/
├── playbooks/
│   ├── site.yml          # 主 Playbook
│   ├── webserver.yml
│   ├── database.yml
│   └── backup.yml
├── roles/
│   ├── common/
│   ├── nginx/
│   ├── mysql/
│   └── monitoring/
├── templates/            # 全局模板
├── files/                # 全局文件
├── scripts/              # 辅助脚本
├── ansible.cfg           # 配置文件
├── requirements.yml      # 角色依赖
└── README.md
```

### 2. Ansible 配置

**ansible.cfg：**

```ini
[defaults]
inventory = ./inventory/production/hosts
remote_user = ubuntu
host_key_checking = False
retry_files_enabled = False
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 86400
roles_path = ./roles
library = ./library
filter_plugins = ./filter_plugins
stdout_callback = yaml
callback_whitelist = profile_tasks, timer

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

### 3. 变量管理最佳实践

```yaml
# group_vars/all.yml - 全局变量
ansible_python_interpreter: /usr/bin/python3
timezone: Asia/Shanghai
ntp_server: ntp.example.com

# group_vars/webservers.yml - 组变量
http_port: 80
max_clients: 200

# host_vars/web1.yml - 主机变量
custom_domain: web1.example.com

# vars/secrets.yml - 敏感信息（需加密）
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
```

### 4. 安全实践

**使用 Ansible Vault：**

```bash
# 创建加密文件
ansible-vault create group_vars/secrets.yml

# 编辑加密文件
ansible-vault edit group_vars/secrets.yml

# 查看加密文件
ansible-vault view group_vars/secrets.yml

# 加密普通文件
ansible-vault encrypt secrets.yml

# 解密文件
ansible-vault decrypt secrets.yml

# 运行 Playbook（输入密码）
ansible-playbook -i inventory site.yml --ask-vault-pass

# 使用密码文件
ansible-playbook -i inventory site.yml --vault-password-file=~/.vault_pass
```

**Playbook 中使用 Vault：**

```yaml
- name: 使用加密变量
  hosts: all
  vars_files:
    - group_vars/secrets.yml
    
  tasks:
    - name: 创建数据库用户
      mysql_user:
        name: app_user
        password: "{{ vault_db_password }}"  # 加密变量
        host: '%'
        priv: '{{ db_name }}.*:ALL'
```

### 5. 错误处理和日志

```yaml
- name: 带完整错误处理的任务
  block:
    - name: 执行关键任务
      command: /usr/bin/critical-task
      register: result
      
    - name: 验证结果
      assert:
        that:
          - result.rc == 0
          - "success" in result.stdout
        fail_msg: "任务执行失败"
        success_msg: "任务成功完成"
        
  rescue:
    - name: 记录错误
      debug:
        msg: "任务失败：{{ result.stderr }}"
        
    - name: 发送告警
      uri:
        url: "{{ alert_webhook_url }}"
        method: POST
        body: "任务失败：{{ inventory_hostname }}"
        status_code: 200
        
    - name: 回滚操作
      command: /usr/bin/rollback-script
      
  always:
    - name: 记录执行日志
      lineinfile:
        path: /var/log/ansible-execution.log
        line: "{{ ansible_date_time.iso8601 }} - {{ inventory_hostname }} - {{ result.rc if result is defined else 'N/A' }}"
```

### 6. 性能优化

```yaml
# 启用 SSH 管道和连接复用
[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r

# 使用 serial 分批执行
- name: 分批部署
  hosts: all
  serial:
    - 10%
    - 25%
    - 100%
    
# 使用 max_fail_percentage 控制失败容忍度
- name: 容错部署
  hosts: all
  max_fail_percentage: 10
  
# 使用 tags 选择性执行
ansible-playbook site.yml --tags "nginx,mysql"

# 使用 limit 限制主机
ansible-playbook site.yml --limit "web1,web2"
```

## 实战案例

### 案例 1：部署 LAMP 栈

```yaml
---
- name: 部署 LAMP 栈
  hosts: webservers
  become: yes
  
  roles:
    - common
    - { role: mysql, tags: ['database'] }
    - { role: php, tags: ['php'] }
    - { role: nginx, tags: ['web'] }
    
  tasks:
    - name: 创建应用目录
      file:
        path: /var/www/myapp
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'
        
    - name: 部署应用代码
      git:
        repo: https://github.com/myapp/repo.git
        dest: /var/www/myapp
        version: main
        
    - name: 配置虚拟主机
      template:
        src: nginx-vhost.conf.j2
        dest: "/etc/nginx/sites-available/{{ app_name }}"
      notify: 重载 Nginx
      
    - name: 启用虚拟主机
      file:
        src: "/etc/nginx/sites-available/{{ app_name }}"
        dest: "/etc/nginx/sites-enabled/{{ app_name }}"
        state: link
      notify: 重载 Nginx
      
  handlers:
    - name: 重载 Nginx
      service:
        name: nginx
        state: reloaded
```

### 案例 2：Docker 环境部署

```yaml
---
- name: 部署 Docker 环境
  hosts: docker_hosts
  become: yes
  
  tasks:
    - name: 安装依赖包
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - software-properties-common
        state: present
        update_cache: yes
        
    - name: 添加 Docker GPG 密钥
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present
        
    - name: 添加 Docker 仓库
      apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
        
    - name: 安装 Docker
      apt:
        name: docker-ce
        state: present
        update_cache: yes
        
    - name: 启动 Docker 服务
      service:
        name: docker
        state: started
        enabled: yes
        
    - name: 安装 Docker Compose
      get_url:
        url: "https://github.com/docker/compose/releases/download/{{ docker_compose_version }}/docker-compose-Linux-x86_64"
        dest: /usr/local/bin/docker-compose
        mode: '0755'
        
    - name: 添加用户到 docker 组
      user:
        name: "{{ ansible_user_id }}"
        groups: docker
        append: yes
```

## Ansible 与 Kubernetes 集成

### 1. 使用 Ansible 部署 K8s 集群

Ansible 是部署 Kubernetes 集群的经典工具，比 kubeadm 更灵活，适合复杂环境。

**使用 kubeadm 部署 K8s：**

```yaml
---
- name: 使用 kubeadm 部署 Kubernetes 集群
  hosts: all
  become: yes
  gather_facts: yes
  
  vars:
    k8s_version: "1.28"
    pod_network_cidr: "10.244.0.0/16"
    service_network_cidr: "10.96.0.0/12"
    
  pre_tasks:
    - name: 禁用 Swap
      command: swapoff -a
      changed_when: yes
      
    - name: 永久禁用 Swap
      lineinfile:
        path: /etc/fstab
        regexp: '^.*swap.*'
        state: absent
        
    - name: 加载内核模块
      modprobe:
        name: "{{ item }}"
        state: present
      loop:
        - overlay
        - br_netfilter
        
    - name: 配置 sysctl 参数
      sysctl:
        name: "{{ item.key }}"
        value: "{{ item.value }}"
        state: present
        reload: yes
      loop:
        - { key: 'net.bridge.bridge-nf-call-iptables', value: '1' }
        - { key: 'net.bridge.bridge-nf-call-ip6tables', value: '1' }
        - { key: 'net.ipv4.ip_forward', value: '1' }
        
  tasks:
    - name: 安装 containerd
      block:
        - name: 安装 containerd 依赖
          apt:
            name:
              - containerd.io
              - runc
            state: present
            update_cache: yes
            
        - name: 配置 containerd
          copy:
            content: |
              [plugins."io.containerd.grpc.v1.cri"]
                [plugins."io.containerd.grpc.v1.cri".containerd]
                  default_runtime_name = "runc"
                  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
                    runtime_type = "io.containerd.runc.v2"
                    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
                      SystemdCgroup = true
            dest: /etc/containerd/config.toml
            
        - name: 重启 containerd
          service:
            name: containerd
            state: restarted
            enabled: yes
            
      rescue:
        - name: 记录 containerd 安装失败
          debug:
            msg: "containerd 安装失败，请检查系统兼容性"
            
    - name: 安装 Kubernetes 组件
      apt:
        name: 
          - "kubeadm={{ k8s_version }}.*"
          - "kubelet={{ k8s_version }}.*"
          - "kubectl={{ k8s_version }}.*"
        state: present
        update_cache: yes
        
    - name: 锁定 kubelet 版本
      command: apt-mark hold kubelet
      args:
        creates: /var/lib/kubelet-held
        
  post_tasks:
    - name: 验证 kubelet 版本
      command: kubelet version
      register: kubelet_version
      changed_when: no
      
    - name: 显示 kubelet 版本
      debug:
        msg: "{{ kubelet_version.stdout_lines }}"
```

**初始化 Control Plane：**

```yaml
---
- name: 初始化 Kubernetes Control Plane
  hosts: control_plane
  become: yes
  
  vars:
    k8s_version: "1.28"
    apiserver_address: "{{ hostvars['k8s-master-01']['ansible_default_ipv4']['address'] }}"
    pod_network_cidr: "10.244.0.0/16"
    
  tasks:
    - name: 初始化集群
      command: >
        kubeadm init
        --apiserver-advertise-address={{ apiserver_address }}
        --pod-network-cidr={{ pod_network_cidr }}
        --cri-socket=unix:///var/run/containerd/containerd.sock
        --ignore-preflight-errors=Swap
      register: kubeadm_init
      changed_when: "'initialized successfully' in kubeadm_init.stdout"
      
    - name: 创建 .kube 目录
      file:
        path: "{{ ansible_user_dir }}/.kube"
        state: directory
        mode: '0700'
        
    - name: 复制 kubeconfig
      copy:
        src: /etc/kubernetes/admin.conf
        dest: "{{ ansible_user_dir }}/.kube/config"
        remote_src: yes
        mode: '0600'
        
    - name: 保存 join 命令
      template:
        src: kubeadm-join-command.sh.j2
        dest: /tmp/kubeadm-join-worker.sh
        mode: '0755'
      when: kubeadm_init is changed
      
    - name: 显示 join 命令
      debug:
        msg: "请运行以下命令将 worker 节点加入集群:\n{{ kubeadm_init.stdout | regex_search('kubeadm join.*') }}"
```

**加入 Worker 节点：**

```yaml
---
- name: 将 Worker 节点加入集群
  hosts: workers
  become: yes
  
  tasks:
    - name: 从 master 获取 join 命令
      fetch:
        src: /tmp/kubeadm-join-worker.sh
        dest: /tmp/kubeadm-join-worker.sh
        flat: yes
      delegate_to: k8s-master-01
      run_once: yes
      
    - name: 复制 join 脚本到 worker
      copy:
        src: /tmp/kubeadm-join-worker.sh
        dest: /tmp/kubeadm-join-worker.sh
        mode: '0755'
        
    - name: 执行 join 命令
      command: /tmp/kubeadm-join-worker.sh
      async: 300
      poll: 10
      register: join_result
      
    - name: 验证节点加入
      command: kubectl get nodes -o json
      delegate_to: k8s-master-01
      run_once: yes
      register: nodes_status
      retries: 5
      delay: 30
      until: nodes_status.stdout | contains(inventory_hostname)
      
    - name: 显示节点状态
      debug:
        msg: "{{ inventory_hostname }} 已成功加入集群"
      when: nodes_status.stdout is defined and inventory_hostname in nodes_status.stdout
```

### 2. 安装 CNI 网络插件

```yaml
---
- name: 安装 Calico 网络插件
  hosts: control_plane
  become: yes
  vars:
    calico_version: "v3.26.1"
    
  tasks:
    - name: 下载 Calico 配置
      get_url:
        url: "https://raw.githubusercontent.com/projectcalico/calico/{{ calico_version }}/manifests/tigera-operator.yaml"
        dest: /tmp/tigera-operator.yaml
        
    - name: 应用 Calico 配置
      command: kubectl apply -f /tmp/tigera-operator.yaml
      register: calico_result
      changed_when: calico_result.rc == 0
      
    - name: 等待 Calico 就绪
      command: kubectl get pods -n kube-system -l k8s-app=calico-node -o jsonpath='{.items[*].status.phase}'
      register: calico_status
      retries: 30
      delay: 10
      until: '"Running"' in calico_status.stdout
      
    - name: 显示 Calico 状态
      debug:
        msg: "Calico 网络插件已就绪"
```

### 3. 使用 k8s 模块管理资源

Ansible 提供了丰富的 Kubernetes 模块，可以直接管理 K8s 资源。

**安装 kubernetes-python：**

```yaml
- name: 安装 Python Kubernetes 库
  pip:
    name:
      - kubernetes
      - openshift
    state: present
  delegate_to: localhost
```

**管理 Deployment：**

```yaml
---
- name: 部署应用
  hosts: control_plane
  become: no
  
  tasks:
    - name: 创建命名空间
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Namespace
          metadata:
            name: myapp
            
    - name: 部署应用
      k8s:
        state: present
        definition:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: myapp
            namespace: myapp
            labels:
              app: myapp
          spec:
            replicas: 3
            selector:
              matchLabels:
                app: myapp
            template:
              metadata:
                labels:
                  app: myapp
              spec:
                containers:
                  - name: myapp
                    image: nginx:{{ nginx_version | default('1.24') }}
                    ports:
                      - containerPort: 80
                    resources:
                      requests:
                        memory: "64Mi"
                        cpu: "250m"
                      limits:
                        memory: "128Mi"
                        cpu: "500m"
                    livenessProbe:
                      httpGet:
                        path: /
                        port: 80
                      initialDelaySeconds: 30
                      periodSeconds: 10
                    readinessProbe:
                      httpGet:
                        path: /
                        port: 80
                      initialDelaySeconds: 5
                      periodSeconds: 5
                        
    - name: 创建 Service
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Service
          metadata:
            name: myapp-service
            namespace: myapp
          spec:
            selector:
              app: myapp
            ports:
              - port: 80
                targetPort: 80
                protocol: TCP
            type: ClusterIP
            
    - name: 验证部署
      k8s_info:
        api_version: v1
        kind: Pod
        namespace: myapp
        label_selectors:
          - app=myapp
      register: pods
      
    - name: 显示 Pod 状态
      debug:
        msg: "部署了 {{ pods.resources | length }} 个 Pod"
```

**滚动更新：**

```yaml
---
- name: 滚动更新应用
  hosts: control_plane
  
  vars:
    app_name: myapp
    namespace: myapp
    new_version: "1.25"
    
  tasks:
    - name: 更新 Deployment 镜像
      k8s:
        state: patched
        definition:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: "{{ app_name }}"
            namespace: "{{ namespace }}"
          spec:
            template:
              spec:
                containers:
                  - name: "{{ app_name }}"
                    image: nginx:{{ new_version }}
        merge_type: strategic
        
    - name: 等待滚动更新完成
      k8s_info:
        api_version: apps/v1
        kind: Deployment
        namespace: "{{ namespace }}"
        name: "{{ app_name }}"
      register: deployment
      retries: 60
      delay: 10
      until: 
        - deployment.resources[0].status.readyReplicas == deployment.resources[0].spec.replicas
        
    - name: 显示更新状态
      debug:
        msg: |
          更新完成!
          期望副本数：{{ deployment.resources[0].spec.replicas }}
          就绪副本数：{{ deployment.resources[0].status.readyReplicas }}
          可用副本数：{{ deployment.resources[0].status.availableReplicas }}
```

**管理 ConfigMap 和 Secret：**

```yaml
---
- name: 管理配置和密钥
  hosts: control_plane
  
  tasks:
    - name: 创建 ConfigMap
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: ConfigMap
          metadata:
            name: app-config
            namespace: myapp
          data:
            APP_ENV: production
            LOG_LEVEL: info
            MAX_CONNECTIONS: "100"
            
    - name: 从文件创建 ConfigMap
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: ConfigMap
          metadata:
            name: app-config-files
            namespace: myapp
          data:
            app.conf: "{{ lookup('file', 'files/app.conf') }}"
            nginx.conf: "{{ lookup('template', 'templates/nginx.conf.j2') }}"
            
    - name: 创建 Secret
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Secret
          metadata:
            name: app-secret
            namespace: myapp
          type: Opaque
          stringData:
            DB_PASSWORD: "{{ vault_db_password }}"
            API_KEY: "{{ vault_api_key }}"
```

### 4. Helm 集成

使用 Ansible 管理 Helm Charts。

**安装 Helm：**

```yaml
---
- name: 安装 Helm
  hosts: control_plane
  
  tasks:
    - name: 下载 Helm
      get_url:
        url: "https://get.helm.sh/helm-v{{ helm_version | default('3.12.0') }}-linux-amd64.tar.gz"
        dest: /tmp/helm.tar.gz
        
    - name: 解压 Helm
      unarchive:
        src: /tmp/helm.tar.gz
        dest: /tmp
        remote_src: yes
        
    - name: 安装 Helm
      copy:
        src: /tmp/linux-amd64/helm
        dest: /usr/local/bin/helm
        mode: '0755'
        
    - name: 验证 Helm 安装
      command: helm version --short
      register: helm_version_output
      changed_when: no
```

**使用 Helm 部署应用：**

```yaml
---
- name: 使用 Helm 部署应用
  hosts: control_plane
  
  vars:
    releases:
      - name: prometheus
        chart: prometheus
        repo: https://prometheus-community.github.io/helm-charts
        namespace: monitoring
        version: "25.18.0"
        values:
          server:
            persistentVolume:
              enabled: false
          alertmanager:
            persistentVolume:
              enabled: false
              
      - name: grafana
        chart: grafana
        repo: https://grafana.github.io/helm-charts
        namespace: monitoring
        version: "7.0.0"
        values:
          adminPassword: "{{ vault_grafana_password }}"
          persistence:
            enabled: false
            size: 10Gi
            
  tasks:
    - name: 创建命名空间
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Namespace
          metadata:
            name: "{{ item.namespace }}"
      loop: "{{ releases }}"
      loop_control:
        label: "{{ item.namespace }}"
        
    - name: 添加 Helm 仓库
      command: >
        helm repo add {{ item.name }}
        {{ item.repo }}
        --force-update
      loop: "{{ releases }}"
      loop_control:
        label: "添加仓库 {{ item.name }}"
      register: helm_repo_add
      changed_when: "'has been added' in helm_repo_add.stdout"
      
    - name: 部署 Helm Chart
      helm:
        name: "{{ item.name }}"
        chart_name: "{{ item.chart }}"
        release_namespace: "{{ item.namespace }}"
        repo_url: "{{ item.repo }}"
        version: "{{ item.version }}"
        values: "{{ item.values }}"
        state: present
      loop: "{{ releases }}"
      loop_control:
        label: "部署 {{ item.name }}"
        
    - name: 验证部署
      command: helm list -n {{ item.namespace }}
      loop: "{{ releases }}"
      register: helm_list
      changed_when: no
      
    - name: 显示部署状态
      debug:
        msg: "{{ item.name }} 部署成功"
      loop: "{{ releases }}"
```

**Helm 升级和回滚：**

```yaml
---
- name: Helm 升级和回滚管理
  hosts: control_plane
  
  vars:
    release_name: prometheus
    namespace: monitoring
    new_version: "25.19.0"
    
  tasks:
    - name: 升级 Helm Release
      helm:
        name: "{{ release_name }}"
        chart_name: prometheus
        release_namespace: "{{ namespace }}"
        repo_url: https://prometheus-community.github.io/helm-charts
        version: "{{ new_version }}"
        state: present
        update_deps: yes
        wait: yes
        timeout: 300
      register: helm_upgrade
      
    - name: 显示升级历史
      command: helm history {{ release_name }} -n {{ namespace }}
      register: helm_history
      changed_when: no
      
    - name: 回滚到上一版本（如果升级失败）
      helm:
        name: "{{ release_name }}"
        release_namespace: "{{ namespace }}"
        state: present
        revision: "{{ helm_history.stdout_lines[-2].split()[0] }}"
      when: helm_upgrade.failed | default(false)
```

### 5. Ingress 管理

```yaml
---
- name: 配置 Ingress
  hosts: control_plane
  
  vars:
    ingress_host: "myapp.example.com"
    tls_enabled: true
    tls_secret: "myapp-tls"
    
  tasks:
    - name: 安装 Nginx Ingress Controller
      helm:
        name: nginx-ingress
        chart_name: ingress-nginx
        repo_url: https://kubernetes.github.io/ingress-nginx
        release_namespace: ingress-nginx
        create_namespace: yes
        values:
          controller:
            service:
              type: LoadBalancer
        state: present
        
    - name: 等待 Ingress Controller 就绪
      k8s_info:
        api_version: v1
        kind: Pod
        namespace: ingress-nginx
        label_selectors:
          - app.kubernetes.io/component=controller
      register: ingress_pods
      retries: 30
      delay: 10
      until: 
        - ingress_pods.resources | length > 0
        - ingress_pods.resources[0].status.phase == 'Running'
        
    - name: 创建 Ingress
      k8s:
        state: present
        definition:
          apiVersion: networking.k8s.io/v1
          kind: Ingress
          metadata:
            name: myapp-ingress
            namespace: myapp
            annotations:
              nginx.ingress.kubernetes.io/rewrite-target: /
              nginx.ingress.kubernetes.io/ssl-redirect: "{{ 'true' if tls_enabled else 'false' }}"
          spec:
            {% if tls_enabled %}
            tls:
              - hosts:
                  - "{{ ingress_host }}"
                secretName: "{{ tls_secret }}"
            {% endif %}
            rules:
              - host: "{{ ingress_host }}"
                http:
                  paths:
                    - path: /
                      pathType: Prefix
                      backend:
                        service:
                          name: myapp-service
                          port:
                            number: 80
```

### 6. 完整 K8s 运维 Playbook

```yaml
---
- name: 完整的 Kubernetes 应用部署和运维
  hosts: control_plane
  become: no
  
  vars_prompt:
    - name: environment
      prompt: "选择环境 (dev/staging/production)"
      private: no
      
  vars_files:
    - vars/k8s_config.yml
    - vars/secrets.yml
    
  tasks:
    # 1. 环境检查
    - name: 检查 kubectl 连接
      command: kubectl cluster-info
      register: cluster_info
      changed_when: no
      
    - name: 显示集群信息
      debug:
        msg: "集群已就绪"
      when: cluster_info.rc == 0
      
    # 2. 准备环境
    - name: 创建命名空间
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Namespace
          metadata:
            name: "{{ app_namespace }}"
            labels:
              environment: "{{ environment }}"
              
    # 3. 部署基础设施
    - name: 部署 Prometheus 监控
      include_tasks: tasks/deploy-prometheus.yml
      when: enable_monitoring | default(false) | bool
      
    # 4. 部署应用
    - name: 部署主应用
      k8s:
        state: present
        src: "files/{{ app_name }}-deployment.yaml"
        
    - name: 部署服务
      k8s:
        state: present
        src: "files/{{ app_name }}-service.yaml"
        
    # 5. 配置 Ingress
    - name: 配置入口
      include_tasks: tasks/configure-ingress.yml
      when: environment == 'production'
      
    # 6. 健康检查
    - name: 等待应用就绪
      k8s_info:
        api_version: v1
        kind: Pod
        namespace: "{{ app_namespace }}"
        label_selectors:
          - app={{ app_name }}
      register: app_pods
      retries: 60
      delay: 10
      until: 
        - app_pods.resources | length >= app_replicas | default(1)
        - app_pods.resources[0].status.phase == 'Running'
        
    # 7. 验证部署
    - name: 验证服务访问
      uri:
        url: "http://{{ ingress_host }}/{{ app_name }}/health"
        status_code: 200
      register: health_check
      retries: 10
      delay: 5
      until: health_check.status == 200
      when: environment != 'dev'
      
    # 8. 清理旧版本
    - name: 清理旧版本资源
      k8s:
        state: absent
        definition:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: "{{ app_name }}"
            namespace: "{{ app_namespace }}"
            labels:
              version: "{{ old_version }}"
      when: cleanup_old_versions | default(false) | bool
      
  handlers:
    - name: 发送部署成功通知
      uri:
        url: "{{ webhook_url }}"
        method: POST
        body_format: json
        body:
          text: "✅ 部署成功 - {{ app_name }} ({{ environment }})"
          username: Ansible
          icon_emoji: ":rocket:"
      listen: "部署完成"
      
    - name: 发送部署失败通知
      uri:
        url: "{{ webhook_url }}"
        method: POST
        body_format: json
        body:
          text: "❌ 部署失败 - {{ app_name }} ({{ environment }})"
          username: Ansible
          icon_emoji: ":warning:"
      listen: "部署失败"
```

### 7. 使用 Ansible 管理多集群

```yaml
---
- name: 管理多个 Kubernetes 集群
  hosts: all
  
  vars:
    clusters:
      production:
        kubeconfig: "~/.kube/config-production"
        namespace: production
      staging:
        kubeconfig: "~/.kube/config-staging"
        namespace: staging
      development:
        kubeconfig: "~/.kube/config-dev"
        namespace: development
        
  tasks:
    - name: 遍历所有集群
      block:
        - name: 设置 kubeconfig
          set_fact:
            KUBECONFIG: "{{ item.value.kubeconfig }}"
          
        - name: 检查集群状态
          command: kubectl cluster-info
          environment:
            KUBECONFIG: "{{ item.value.kubeconfig }}"
          register: cluster_status
          changed_when: no
          
        - name: 部署应用到集群
          k8s:
            state: present
            definition:
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: myapp
                namespace: "{{ item.value.namespace }}"
              spec:
                replicas: "{{ item.value.replicas | default(1) }}"
                selector:
                  matchLabels:
                    app: myapp
                template:
                  metadata:
                    labels:
                      app: myapp
                  spec:
                    containers:
                      - name: myapp
                        image: myapp:{{ app_version }}
          environment:
            KUBECONFIG: "{{ item.value.kubeconfig }}"
            
      loop: "{{ clusters | dict2items }}"
      loop_control:
        label: "{{ item.key }}"
        
      rescue:
        - name: 记录集群部署失败
          debug:
            msg: "集群 {{ item.key }} 部署失败"
```

### 8. K8s 资源监控和告警

```yaml
---
- name: K8s 资源监控和清理
  hosts: control_plane
  
  tasks:
    - name: 收集资源使用率
      command: kubectl top nodes
      register: node_resources
      changed_when: no
      
    - name: 检查资源使用率
      set_fact:
        high_usage_nodes: >-
          {{ node_resources.stdout 
          | regex_findall('(\S+)\s+\d+\s+(\d+)/\d+') 
          | select('match', '80|90|100') 
          | list }}
          
    - name: 告警：节点资源使用率高
      debug:
        msg: "警告：节点资源使用率超过阈值"
      when: high_usage_nodes | length > 0
      changed_when: no
      
    - name: 清理失败 Pod
      command: >
        kubectl delete pods --field-selector=status.phase=Failed
        -n {{ item }}
      loop:
        - default
        - kube-system
        - monitoring
      ignore_errors: yes
      register: cleanup_result
      
    - name: 清理完成 Pod
      command: >
        kubectl delete pods --field-selector=status.phase=Succeeded
        -n {{ item }}
      loop:
        - batch
        - jobs
      ignore_errors: yes
      
    - name: 显示清理结果
      debug:
        msg: "已清理 {{ cleanup_result | length }} 个命名空间中的异常 Pod"
```

### 9. 备份和恢复

```yaml
---
- name: Kubernetes 资源备份和恢复
  hosts: control_plane
  
  vars:
    backup_dir: "/backup/k8s"
    backup_date: "{{ ansible_date_time.iso8601_basic_short }}"
    
  tasks:
    - name: 创建备份目录
      file:
        path: "{{ backup_dir }}/{{ backup_date }}"
        state: directory
        mode: '0755'
        
    - name: 备份所有命名空间
      command: >
        kubectl get all --all-namespaces -o yaml
        > {{ backup_dir }}/{{ backup_date }}/all-resources.yaml
      register: backup_all
      
    - name: 备份 ConfigMaps 和 Secrets
      command: >
        kubectl get configmaps,secrets --all-namespaces -o yaml
        > {{ backup_dir }}/{{ backup_date }}/configmaps-secrets.yaml
      register: backup_configs
      
    - name: 压缩备份文件
      command: >
        tar -czf {{ backup_dir }}/backup-{{ backup_date }}.tar.gz
        -C {{ backup_dir }} {{ backup_date }}
        
    - name: 清理旧备份（保留 7 天）
      find:
        paths: "{{ backup_dir }}"
        patterns: "*.tar.gz"
        age: "7d"
      register: old_backups
      
    - name: 删除旧备份
      file:
        path: "{{ item.path }}"
        state: absent
      loop: "{{ old_backups.files }}"
      when: old_backups.files | length > 0
      
    - name: 显示备份状态
      debug:
        msg: "备份完成：{{ backup_dir }}/backup-{{ backup_date }}.tar.gz"
```

## 调试和排错

### 1. 调试技巧

```bash
# 检查模式（不实际执行）
ansible-playbook site.yml --check

# 差异模式（显示文件变化）
ansible-playbook site.yml --diff

# 提高详细程度
ansible-playbook site.yml -v    # 一般信息
ansible-playbook site.yml -vv   # 更多细节
ansible-playbook site.yml -vvv  # 详细输出
ansible-playbook site.yml -vvvv # 调试级别

# 在特定任务后中断
ansible-playbook site.yml --step

# 执行到特定标签
ansible-playbook site.yml --start-at-task="任务名称"
```

### 2. 常用调试任务

```yaml
- name: 调试变量
  debug:
    var: my_variable
    
- name: 显示主机 facts
  setup: {}
  register: facts
  
- name: 显示 facts
  debug:
    var: facts.ansible_facts.ansible_distribution

- name: 失败并显示消息
  fail:
    msg: "调试中断点：{{ some_variable }}"
    
- name: 等待用户输入
  pause:
    prompt: "按回车继续..."
```

### 3. 性能分析

```bash
# 启用性能回调插件
[defaults]
stdout_callback = profile_tasks
callback_whitelist = profile_tasks

# 运行 Playbook 查看每个任务耗时
ansible-playbook site.yml

# 输出示例：
# PLAY RECAP *****************************************************************
# ...
# 
# TASK PROFILE (time in seconds):
# - 安装 Nginx: 12.345
# - 配置 Nginx: 2.123
# - 启动服务：1.456
```

## 总结

### 核心要点

1. **无代理架构** — 通过 SSH 连接，简化部署
2. **幂等性** — 确保多次执行结果一致
3. **YAML 语法** — 直观易读的 Playbook
4. **角色管理** — 模块化、可复用的代码组织
5. **变量优先级** — 灵活配置管理
6. **错误处理** — block/rescue/always 机制
7. **安全实践** — Ansible Vault 加密敏感信息
8. **K8s 集成** — 原生支持 Kubernetes 资源管理
9. **Helm 管理** — 自动化 Helm Charts 部署和升级
10. **多集群管理** — 统一管理多个 K8s 集群

### Ansible + Kubernetes 最佳实践

- ✅ 使用 `k8s` 模块直接管理资源，避免 YAML 文件管理
- ✅ 使用 Helm 管理复杂应用（如 Prometheus、Grafana）
- ✅ 实现滚动更新和健康检查
- ✅ 配置 Ingress 和 TLS 自动化
- ✅ 定期备份 K8s 资源
- ✅ 监控资源使用率和异常 Pod
- ✅ 使用多集群管理实现环境隔离

### 学习路径

1. ✅ 掌握基础概念和 ad-hoc 命令
2. ✅ 编写简单 Playbook
3. ✅ 学习变量、模板、条件执行
4. ✅ 创建和使用角色
5. ✅ 掌握高级特性（异步、滚动更新等）
6. ✅ **学习 K8s 集成** — 部署集群、管理资源
7. ✅ **学习 Helm 集成** — 自动化应用部署
8. ✅ **实践多集群管理** — 生产环境运维

### 下一步

- [ ] 学习 Ansible Galaxy 使用
- [ ] 掌握动态库存编写
- [ ] 自定义模块和插件开发
- [ ] 集成 CI/CD 流水线（GitLab CI + Ansible）
- [ ] 学习 Ansible Tower/Automation Controller
- [ ] **深入学习 K8s Operator 开发**
- [ ] **实践 GitOps 工作流（ArgoCD + Ansible）**
- [ ] 参与开源角色贡献

---

**更新时间**: 2026-05-14  
**阅读时间**: 45 分钟  
**适用场景**: 自动化运维、配置管理、批量部署、Kubernetes 运维、基础设施即代码

### 参考资源

- [Ansible 官方文档](https://docs.ansible.com/)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [Ansible 最佳实践](https://docs.ansible.com/ansible/latest/user_guide/best_practices.html)
- [Ansible 中文社区](https://www.ansible.com.cn/)
- [Ansible Kubernetes 模块](https://docs.ansible.com/ansible/latest/collections/kubernetes/core/k8s_module.html)
- [Ansible Helm 模块](https://docs.ansible.com/ansible/latest/collections/community/general/helm_module.html)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
