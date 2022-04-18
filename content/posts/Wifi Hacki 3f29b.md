---
title: "TryHackMe | Wifi Hacking 101 Write-Up"
date: 2022-04-19T00:09:00+03:00
draft: false
---

Bu içerik TryHackMe platformunda Wifi Hacking 101 odasının, çoğu noktalarda çevirisini ve soruların cevaplarını içerir. Odanın linki için:

[https://tryhackme.com/room/wifihacking101](https://tryhackme.com/room/wifihacking101)

**Görev 1 | Temel Bilgiler - WPA’ya Giriş**

Anahtar kelimeler

- SSID: Bağlanmaya çalışırken gördüğünüz ağ adı
- ESSID: Birden fazla access point’e uygulanabilecek SSID. Örneğin normalden daha büyük bir ağ oluşturan şirket ofisi. Aircrack’ta bu, saldıracağınız ağdır.
- BSSID: Access Point MAC adresi
- WPA2-PSK: Herkesin aynı parolayla bağlandığı WiFi ağlarında bulunur.
- WPA2-EAP: RADIUS server’a gönderilen, kimlik doğrulama (authentication) işleminin kullanıcı adı ve parola kullanılarak yapıldığı WiFi ağlarında bulunur.
- RADIUS: Client’ların kimliklerini doğrulamak için varolan bir sunucu. (sadece wifi için değil)

WPA2 kimlik doğrulamasının esası **4 way handshake**’dir.

Çoğu ev ve diğer WiFi ağları, WPA2-Personal kullanır. Bir WiFi ağına parolayla girmeye çalışıyorsanız ve bu WEP değilse, o zaman WPA2-Personal’dir. WPA2-EAP kimlik doğrulaması için RADIUS server’larını kullanır, yani bağlanmak için eğer kullanıcı adı ve şifre girmeniz gerekiyorsa, muhtemelen WPA2-EAP bulunur.

Önceden, WEP (Wired Equivalent Privacy) kullanılıyordu. Bu yöntemin güvensiz olduğu ve parolayı bazı istatistiksel yöntemlerle tahmin etmeye yetecek kadar paket yakalayarak kırılabileceği gösterildi.

4 Way Handshake, client ve access point’in, birbirlerine parolayı söylemeden, parolayı bildiklerini kanıtlamalarını sağlar. WPA ve WPA2 pratik olarak aynı kimlik doğrulama yöntemini kullanır, yani saldırılar ikisinde de aynıdır.

WPA anahtarları, ESSID’den ve ağın parolasından türetilir. ESSID, **dictionary attack** saldırılarını daha zor hale getirir. Bu, verilen bir parola için , anahtarın her access point için hala değişeceği anlamına gelir. Bu demektir ki, sözlüğünüzü yalnızca bu access point/MAC adresi için önceden hesaplamadığınız sürece, doğru parolayı bulana kadar belki de bir sürü parola denemeniz gerekecektir.

**Sorular ve Cevapları**

> *WPA2-Personal üzerindeki şifrelemeye ne tür bir saldırı gerçekleştirirsiniz?*
> 
> 
> `brute force`
> 

> *Bu yöntem, WPA2-EAP handshake’lerinde saldırı için kullanılabilir mi?*
> 
> 
> `nay`
> 

> *“wifi code/password/passphrase” için kullanılan teknik terimin 3 harfli kısaltması nedir?*
> 
> 
> `PSK`
> 

> *WPA2 Kişisel parolasının minimum uzunluğu kaçtır?*
> 
> 
> `8`
> 

**Görev 2 | İzleniyorsunuz - Saldırmak İçin Paketleri Yakalamak**

Aircrack-ng tool’unu kullanarak, ağ saldırılarına başlayabiliriz. Bu, monitor mode’a aldığınız bir NIC’a sahip olduğunuzu varsayarak, bir ağa kendiniz saldırmanızda size yol gösterecektir.

WPA ağlarına saldırmak için aircrack-ng, airodump-ng ve airmon-ng’yi kullanacağız.

4 way handshake yakalamanız için monitor moda alınmış bir NIC’a ihtiyacınız olacak.

**Sorular ve Cevapları**

> *Airtrack toolları ile “wlan0” interface’ini monitor moda nasıl alırsınız?*
> 
> 
> `airmon-ng start wlan0`
> 

> *Monitor moda geçtikten sonra karşınıza çıkan yeni interface’in ismi nedir?*
> 
> 
> `wlan0mon`
> 

> *Eğer diğer process’ler de bu network adapter’i kullanmaya çalışıyorsa ne yaparsınız?*
> 
> 
> `airmon-ng check kill`
> 

> *Aircrack-ng toollarından hangisi bir capture oluşturmak için kullanılır?*
> 
> 
> `airodump-ng`
> 

> *İzleme aşaması için, BSSID’yı ayarlamak için hangi flag’ı kullanırsınız?*
> 
> 
> `--bssid`
> 

> *Ve channel ayarını ayarlamak için?*
> 
> 
> `--channel`
> 

> *Yakalanan paketlerin bir dosyaya kaydedilmisini nasıl sağlarsınız?*
> 
> 
> `-w`
> 

**Görev 3 | Aircrack-ng - Hadi Kıralım**

Kırma alıştırması yapmanız için size birkaç capture vereceğim. Eğer kırmanız 3 dakikadan fazla sürerse, anlayınki bir şeyler yanlış gitti.

Parola kırmak için, aircrack’in kendisini kullanabiliriz ya da GPU’nun hızından faydalanmak için hashcat’i kullanabiliriz.

Kullanışlı bilgiler

BSSID: 02:1A:11:FF:D9:BD

ESSID: 'James Honor 8’

**Sorular ve Cevapları**

> *Saldırılacak BSSID’yi belirlemek için hangi flag’i kullanırız?*
> 
> 
> `-b`
> 

> *Wordlist’i belirlemek için hangi flag’i kullanırız?*
> 
> 
> `-w`
> 

> *Hashcat kullanmak amacıyla, şifreyi kırmaya çalışırken oluşturduğumuz HCCAPX’i nasıl oluştururuz?*
> 
> 
> `-j`
> 

> *Rockyou wordlist’ini kullanarak, verilen capture’daki parolayı kırın. Kırdığınız parola nedir?*
> 
> 
> `greeneggsandham`
> 

> *Parola kırma hangisinde daha hızlı gerçekleşir, CPU mu GPU mu?*
> 
> 
> `GPU`
>

Yazdığım içeriği okuduğunuz için teşekkür ederim. İyi çalışmalar.
