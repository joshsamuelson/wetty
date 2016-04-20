class wetty (
  $install_dir = $::wetty::params::install_dir,
  $port = '80',
  $command = '/bin/login',
) inherits wetty::params {

  include nodejs

  file { '/usr/lib/systemd/system/wetty.service':
    ensure     => 'present',
    mode       => '0755',
    content    => epp('wetty/wetty.conf.epp',{
      'port'   => $port,
      'command' => $command,
    })
  }

  service { 'wetty':
    ensure    => 'running',
    enable    => true,
    require   => Exec['npm install -g'],
    subscribe => File['/usr/lib/systemd/system/wetty.service'],
  }

  vcsrepo { $install_dir:
    ensure   => present,
    source   => 'https://github.com/puppetlabs/wetty.git',
    provider => 'git',
  }

  exec { 'npm install -g':
    path    => '/usr/local/bin:/usr/bin:/bin',
    cwd     => $install_dir,
    unless  => 'npm -g list wetty',
    require => [Class['nodejs'],Vcsrepo[$install_dir]],
  }
}
