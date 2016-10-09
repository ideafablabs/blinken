# Blinken

## Development Setup

To ease installation, it is suggested you install and run with Vagrant. However, if you do not wish to use Vagrant (Disk Space or Stubbornness), the Vagrant configuration in no way inhibits you from doing so.

### With Vagrant

Vagrant is a portable environment that removes the hassle of aligning your local environment with the needs of the application. This will normally allow you to get started with development extremely fast. This is also ideal if you work on multiple projects, as tweaking your environment for one application while often result in another breaking. Vagrant is cross-platform, so Blinken can be ran effortlessly on Windows, Mac and Linux. 

#### Prerequisites 
- [Vagrant](http://vagrantup.com)
- [VirtualBox](https://www.virtualbox.org/wiki/Downloads)

#### Setup
1. Checkout blinken `git checkout https://github.com/ideafablabs/blinken.git`
1. Provision Vagrant `vagrant up --provision` (this only needs to be ran **once**)
1. Follow any prompts
1. SSH into Vagrant `vagrant ssh`
1. Move to the active directory `cd /vagrant`
1. Start the application `node app.js`

#### Common Vagrant Operations
- Stopping Vagrant - `vagrant halt`
- Starting Vagrant - `vagrant up`
- SSH to box - `vagrant ssh`
- Destroy/Remove Box - `vagrant destroy`

### On Local System/No Virtualization
- Install Node
```
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
```

- Install Modules
```
sudo npm install
```
### Troubleshooting
If you are or have developed with node on your system in the past, it's very likely you'll encounter some issues. Blinken relies on specific versioning due to specific and fringe dependencies. While having multiple node.js versions on your system is possible, it's tricky, and will likely cause you headaches. You may want to just use Vagrant. 

1. Check your node version and ensure it is 4.x `node -v`
1. Check your global node modules, and compare these with modules in `package.json`
1. Check your NPM version. 

See readme in `/app` directory for information on how to use and configure Blinken.
