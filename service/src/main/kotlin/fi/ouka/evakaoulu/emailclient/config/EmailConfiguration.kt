// SPDX-FileCopyrightText: 2021 City of Oulu
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.ouka.evakaoulu.emailclient.config

import fi.espoo.evaka.emailclient.IEmailMessageProvider
import fi.espoo.evaka.shared.AssistanceNeedDecisionId
import fi.espoo.evaka.shared.ChildId
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

@Profile("evakaoulu")
@Configuration
class EmailConfiguration {

    @Bean
    fun emailMessageProvider(): IEmailMessageProvider = EmailMessageProvider()
}

internal class EmailMessageProvider(): IEmailMessageProvider {
    override val subjectForPendingDecisionEmail: String = "Toimenpiteitäsi odotetaan / Waiting for your action"
    override val subjectForClubApplicationReceivedEmail: String = "Hakemus vastaanotettu / Application received"
    override val subjectForDaycareApplicationReceivedEmail: String = "Hakemus vastaanotettu / Application received"
    override val subjectForPreschoolApplicationReceivedEmail: String = "Hakemus vastaanotettu / Application received"
    override val subjectForDecisionEmail: String = "Sama suomeksi / This space intentionally left blank"



    override fun getPendingDecisionEmailHtml(): String {
        return """
            <p>Hei!</p>
            
            <p>Sinulla on vastaamaton päätös Oulun varhaiskasvatukselta. Päätös tulee hyväksyä tai hylätä kahden viikon sisällä sen saapumisesta osoitteessa <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi</a> tai ottamalla yhteyttä päätöksessä mainittuun päiväkodin johtajaan.</p>
            
            <p>Tähän viestiin ei voi vastata.</p>
            
            <hr>
            
            <p>Hello!</p>

            <p>A decision has been made for you by the Oulu early childhood education and care services and remains unanswered. The decision must be accepted or rejected within two weeks of its arrival online at <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi</a> or by contacting the daycare centre manager listed in the decision.</p> 

            <p>You may not reply to this message.</p>
            
            
        """.trimIndent()
    }

    override fun getPendingDecisionEmailText(): String {
        return """
            Hei! 

            Sinulla on vastaamaton päätös Oulun varhaiskasvatukselta. Päätös tulee hyväksyä tai hylätä kahden viikon sisällä sen saapumisesta osoitteessa varhaiskasvatus.ouka.fi tai ottamalla yhteyttä päätöksessä mainittuun päiväkodin johtajaan. 

            Tähän viestiin ei voi vastata.  
            
            ------------------------------------------------------------------------------
            
            Hello! 

            A decision has been made for you by the Oulu early childhood education and care services and remains unanswered. The decision must be accepted or rejected within two weeks of its arrival online at varhaiskasvatus.ouka.fi or by contacting the daycare centre manager listed in the decision. 

            You may not reply to this message.  
            
        """.trimIndent()
    }

    override fun getClubApplicationReceivedEmailHtml(): String {
        return """
            <p>Hei!</p>
            
            <p>Olemme vastaanottaneet lapsenne hakemuksen avoimeen varhaiskasvatukseen. Pyydämme teitä olemaan yhteydessä suoraan toivomanne päiväkodin johtajaan ja tiedustelemaan vapaata avoimen varhaiskasvatuksen paikkaa.</p>
            
            <p>Hakemuksia käsitellään pääsääntöisesti vastaanottopäivämäärän mukaan. Sisarukset valitaan myös hakujärjestyksessä, ellei ole erityisperustetta.</p>
            
            <p>Päätös on nähtävissä ja hyväksyttävissä/hylättävissä <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>

            <p>
            Ystävällisesti <br/>
            Varhaiskasvatuksen palveluohjaus <br/>
            </p>
            
            <p>Tähän viestiin ei voi vastata.</p>
            
            <hr>
            
            <p>Hello!</p>
            
            <p>We have received your child’s application for open early childhood education and care. We request you to directly contact the manager of the daycare centre you wish to enrol in and inquire for free places in open early childhood education and care.</p>
            
            <p>The applications are usually processed in the order they are received. Siblings will also be enrolled in the order of application unless special ground exist.</p>
            
            <p>The decision may be viewed and accepted or rejected online at <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>
            
            <p>Yours, <br/>
            Early childhood education services coordination team <br/>
            </p>

            <p>You may not reply to this message.</p>
            
        """.trimIndent()
    }

    override fun getClubApplicationReceivedEmailText(): String {
        return """
            Hei! 
            
            Olemme vastaanottaneet lapsenne hakemuksen avoimeen varhaiskasvatukseen. Pyydämme teitä olemaan yhteydessä suoraan toivomanne päiväkodin johtajaan ja tiedustelemaan vapaata avoimen varhaiskasvatuksen paikkaa. 
            
            Hakemuksia käsitellään pääsääntöisesti vastaanottopäivämäärän mukaan. Sisarukset valitaan myös hakujärjestyksessä, ellei ole erityisperustetta. 
           
            Päätös on nähtävissä ja hyväksyttävissä/hylättävissä varhaiskasvatus.ouka.fi.  
            
            Ystävällisesti,  
            
            Varhaiskasvatuksen palveluohjaus 
            
            Tähän viestiin ei voi vastata.
            
            ------------------------------------------------------------------------------
            
            Hello! 

            We have received your child’s application for open early childhood education and care. We request you to directly contact the manager of the daycare centre you wish to enrol in and inquire for free places in open early childhood education and care. 

            The applications are usually processed in the order they are received. Siblings will also be enrolled in the order of application unless special ground exist. 

            The decision may be viewed and accepted or rejected online at varhaiskasvatus.ouka.fi.  
            
            Yours, 

            Early childhood education services coordination team 
            
            You may not reply to this message. 
            
        """.trimIndent()
    }

    override fun getDaycareApplicationReceivedEmailHtml(): String {
        return """
            <p>Hei!</p>
            
            <p>Lapsenne varhaiskasvatushakemus on vastaanotettu. Hakemuksen tehnyt huoltaja voi muokata hakemusta osoitteessa <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi</a> siihen saakka, kunnes palveluohjaus ottaa sen käsittelyyn. Varhaiskasvatuspaikan järjestelyaika on neljä kuukautta. Mikäli kyseessä on vanhemman äkillinen työllistyminen tai opintojen alkaminen, järjestelyaika on kaksi viikkoa. Toimittakaa tällöin työ- tai opiskelutodistus hakemuksen liitteeksi. Kahden viikon järjestelyaika alkaa todistuksen saapumispäivämäärästä. Jatketun aukiolon ja vuorohoidon palveluita järjestetään vanhempien vuorotyön perusteella.</p>
            
            <p><b>Mikäli lapsellenne järjestyy varhaiskasvatuspaikka jostakin hakemuksessa toivomastanne kunnallisesta varhaiskasvatuspaikasta</b>, ilmoitamme teille paikan viimeistään kaksi viikkoa ennen varhaiskasvatuksen toivottua aloitusajankohtaa. Muussa tapauksessa olemme teihin yhteydessä.</p>
            
            <p><b>Mikäli valitsitte ensimmäiseksi hakutoiveeksi yksityisen päiväkodin tai perhepäivähoitajan</b>, olkaa suoraan yhteydessä kyseiseen palveluntuottajaan varmistaaksenne varhaiskasvatuspaikan saamisen. Mikäli toivomanne palveluntuottaja ei pysty tarjoamaan varhaiskasvatuspaikkaa, pyydämme teitä olemaan yhteydessä varhaiskasvatuksen palveluohjaukseen.</p>
            
            <p><b>Siirtohakemukset</b> (lapsella on jo varhaiskasvatuspaikka Oulun kaupungin varhaiskasvatusyksikössä) käsitellään pääsääntöisesti hakemuksen saapumispäivämäärän mukaan. Merkittäviä syitä siirtoon ovat: aikaisemman varhaiskasvatuspaikan lakkauttaminen, sisarukset ovat eri yksiköissä, pitkä matka, huonot kulkuyhteydet, lapsen ikä, ryhmän ikärakenne, vuorohoidon tarpeen loppuminen sekä huomioon otettavat erityisperusteet.</p>
            
            <p><b>Mikäli ilmoititte hakemuksessa lapsenne tuen tarpeesta</b>, varhaiskasvatuksen erityisopettaja on teihin yhteydessä, jotta lapsen tuen tarpeet voidaan ottaa huomioon paikkaa osoitettaessa.</p>
            
            <p>Päätös on nähtävissä ja hyväksyttävissä/hylättävissä <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>
            
            <p>
            Ystävällisesti <br/>
            Varhaiskasvatuksen palveluohjaus <br/>
            </p>
            
            <p>Tähän viestiin ei voi vastata.</p>
            
                        
            <hr>
            
            <p>Hello!</p>
            
            <p>The early childhood education and care application for your child has been received. The guardian who filed the application may edit it online at varhaiskasvatus.ouka.fi until such time as the service coordination team takes it up for processing. The time necessary to organize a berth in early childhood education and care is four months. If care must begin earlier due to a parent’s sudden employment or beginning of their studies, the minimum time of notice is two weeks. In such a case, a certificate of employment or student status must be presented as an appendix to the application. The two weeks’ notice begins at the date this certificate is submitted. Extended opening hours and round-the-clock care services are provided if necessitated by the parents’ working hours.</p>
            
            <p>If placement in early childhood care and education can be offered for your child in one of the municipal early childhood education and care locations specified in your application, we will inform you of the location two before the intended start date at the latest. If not, we will contact you by telephone.</p>
            
            <p>If the first care location you picked is a private daycare centre or child minder, you should directly contact the service provider in question to ensure placement can be offered to you. If the service provider your picked is unable to offer you a berth in care, we request you to contact the early childhood education and care services service counselling centre.</p>
            
            <p>Transfer applications (for children who are already enrolled in a City of Oulu early childhood education and care unit) will usually be processed in the order such applications are received. Acceptable reasons for transfer include: shutdown of the current care location, siblings enrolled in a different unit, a long distance, poor transportation connections, the age of the child, the age structure of the group, the end of a need for round-the-clock care, and other specific grounds to be considered individually.</p>
            
            <p>If you have specified a need for special support for your child in the application, a special needs early childhood education teacher will contact you in order to best consider your child’s need for support in making the enrolment decision.</p>
            
            <p>The decision may be viewed and accepted or rejected online at <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi</a></p>
            
            <p>Yours, <br/>
            Early childhood education services coordination team <br/>
            </p>
            
            <p>You may not reply to this message.</p>
            
        """.trimIndent()
    }

    override fun getDaycareApplicationReceivedEmailText(): String {
        return """
            Hei! 

            Lapsenne varhaiskasvatushakemus on vastaanotettu. Hakemuksen tehnyt huoltaja voi muokata hakemusta osoitteessa varhaiskasvatus.ouka.fi siihen saakka, kunnes palveluohjaus ottaa sen käsittelyyn. Varhaiskasvatuspaikan järjestelyaika on neljä kuukautta. Mikäli kyseessä on vanhemman äkillinen työllistyminen tai opintojen alkaminen, järjestelyaika on kaksi viikkoa. Toimittakaa tällöin työ- tai opiskelutodistus hakemuksen liitteeksi. Kahden viikon järjestelyaika alkaa todistuksen saapumispäivämäärästä. Jatketun aukiolon ja vuorohoidon palveluita järjestetään vanhempien vuorotyön perusteella. 

            Mikäli lapsellenne järjestyy varhaiskasvatuspaikka jostakin hakemuksessa toivomastanne kunnallisesta varhaiskasvatuspaikasta, ilmoitamme teille paikan viimeistään kaksi viikkoa ennen varhaiskasvatuksen toivottua aloitusajankohtaa. Muussa tapauksessa olemme teihin yhteydessä.  

            Mikäli valitsitte ensimmäiseksi hakutoiveeksi yksityisen päiväkodin tai perhepäivähoitajan, olkaa suoraan yhteydessä kyseiseen palveluntuottajaan varmistaaksenne varhaiskasvatuspaikan saamisen. Mikäli toivomanne palveluntuottaja ei pysty tarjoamaan varhaiskasvatuspaikkaa, pyydämme teitä olemaan yhteydessä varhaiskasvatuksen palveluohjaukseen. 

            Siirtohakemukset (lapsella on jo varhaiskasvatuspaikka Oulun kaupungin varhaiskasvatusyksikössä) käsitellään pääsääntöisesti hakemuksen saapumispäivämäärän mukaan. Merkittäviä syitä siirtoon ovat: aikaisemman varhaiskasvatuspaikan lakkauttaminen, sisarukset ovat eri yksiköissä, pitkä matka, huonot kulkuyhteydet, lapsen ikä, ryhmän ikärakenne, vuorohoidon tarpeen loppuminen sekä huomioon otettavat erityisperusteet. 

            Mikäli ilmoititte hakemuksessa lapsenne tuen tarpeesta, varhaiskasvatuksen erityisopettaja on teihin yhteydessä, jotta lapsen tuen tarpeet voidaan ottaa huomioon paikkaa osoitettaessa.  

            Päätös on nähtävissä ja hyväksyttävissä/hylättävissä varhaiskasvatus.ouka.fi.  

            Hakemuksen liitteet voi lisätä suoraan sähköiselle hakemukselle varhaiskasvatus.ouka.fi tai postitse osoitteeseen Varhaiskasvatuksen palveluohjaus, PL 75, 90015 Oulun kaupunki. 
            
            Ystävällisesti, 
            Varhaiskasvatuksen palveluohjaus 
                        
            Tähän viestiin ei voi vastata.
            
            ------------------------------------------------------------------------------
            
            Hello! 
            
            The early childhood education and care application for your child has been received. The guardian who filed the application may edit it online at varhaiskasvatus.ouka.fi until such time as the service coordination team takes it up for processing. The time necessary to organize a berth in early childhood education and care is four months. If care must begin earlier due to a parent’s sudden employment or beginning of their studies, the minimum time of notice is two weeks. In such a case, a certificate of employment or student status must be presented as an appendix to the application. The two weeks’ notice begins at the date this certificate is submitted. Extended opening hours and round-the-clock care services are provided if necessitated by the parents’ working hours. 

            If placement in early childhood care and education can be offered for your child in one of the municipal early childhood education and care locations specified in your application, we will inform you of the location two before the intended start date at the latest. If not, we will contact you by telephone.  

            If the first care location you picked is a private daycare centre or child minder, you should directly contact the service provider in question to ensure placement can be offered to you. If the service provider your picked is unable to offer you a berth in care, we request you to contact the early childhood education and care services service counselling centre. 

            Transfer applications (for children who are already enrolled in a City of Oulu early childhood education and care unit) will usually be processed in the order such applications are received. Acceptable reasons for transfer include: shutdown of the current care location, siblings enrolled in a different unit, a long distance, poor transportation connections, the age of the child, the age structure of the group, the end of a need for round-the-clock care, and other specific grounds to be considered individually. 

            If you have specified a need for special support for your child in the application, a special needs early childhood education teacher will contact you in order to best consider your child’s need for support in making the enrolment decision.  

            The decision may be viewed and accepted or rejected online at varhaiskasvatus.ouka.fi.  

            Yours, 
            Early childhood education services coordination team 

            You may not reply to this message. 
 
        """.trimIndent()
    }

    override fun getPreschoolApplicationReceivedEmailHtml(withinApplicationPeriod: Boolean): String {
        return """
            <p>Hei!</p>
            
            <p>Olemme vastaanottaneet lapsenne ilmoittautumisen esiopetukseen. Hakemuksen tehnyt huoltaja voi muokata hakemusta siihen saakka, kunnes palveluohjaus ottaa sen käsittelyyn. Varhaiskasvatuksen palveluohjaus sijoittaa kaikki esiopetukseen ilmoitetut lapset esiopetusyksiköihin maaliskuun aikana. Päätös on nähtävissä ja hyväksyttävissä/hylättävissä <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>
            
            <p>Mikäli hakemaanne yksikköön ei perusteta esiopetusryhmää, palveluohjaus on teihin yhteydessä ja tarjoaa paikkaa sellaisesta yksiköstä, johon esiopetusryhmä on muodostunut.</p>
            
            <p>Mikäli ilmoititte hakemuksessa lapsenne tuen tarpeesta, varhaiskasvatuksen erityisopettaja on teihin yhteydessä, jotta lapsen tuen tarpeet voidaan ottaa huomioon paikkaa osoitettaessa.</p>
            
            <p><b>ESIOPETUKSEEN LIITTYVÄ VARHAISKASVATUS</b></p>
            
            <p>Mikäli hait esiopetukseen liittyvää varhaiskasvatusta, otathan huomioon:</p>
            <ul><li>Varhaiskasvatuspaikan järjestelyaika on neljä kuukautta. Jatketun aukiolon ja vuorohoidon palveluita järjestetään vanhempien vuorotyön tai iltaisin ja/tai viikonloppuisin tapahtuvan opiskelun perusteella.</li>
            <li><b>Mikäli lapsellenne järjestyy varhaiskasvatuspaikka jostakin hakemuksessa toivomastanne kunnallisesta varhaiskasvatuspaikasta,</b> ilmoitamme teille paikan viimeistään kaksi viikkoa ennen varhaiskasvatuksen toivottua aloitusajankohtaa. Muussa tapauksessa olemme teihin yhteydessä.</li>
            <li><b>Mikäli valitsitte ensimmäiseksi hakutoiveeksi yksityisen päiväkodin</b>, olkaa suoraan yhteydessä kyseiseen yksikköön varmistaaksenne varhaiskasvatuspaikan saamisen. Mikäli toivomanne palveluntuottaja ei pysty tarjoamaan varhaiskasvatuspaikkaa, pyydämme teitä olemaan yhteydessä varhaiskasvatuksen palveluohjaukseen.</li>
            <li><b>Siirtohakemukset</b> (lapsella on jo varhaiskasvatuspaikka Oulun kaupungin varhaiskasvatusyksikössä) käsitellään pääsääntöisesti hakemuksen saapumispäivämäärän mukaan. Merkittäviä syitä siirtoon ovat: aikaisemman varhaiskasvatuspaikan lakkauttaminen, sisarukset ovat eri yksiköissä, pitkä matka, huonot kulkuyhteydet, lapsen ikä, ryhmän ikärakenne, vuorohoidon tarpeen loppuminen sekä huomioon otettavat erityisperusteet.</li>
            </ul>
            <p>Päätös on nähtävissä ja hyväksyttävissä/hylättävissä <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>
            
            <p>Hakemuksen liitteet lisätään suoraan sähköiselle hakemukselle eVakassa.</p>
            
            <p>
            Ystävällisesti <br/>
            Varhaiskasvatuksen palveluohjaus <br/>
            </p>
            
            <p>Tähän viestiin ei voi vastata.</p>
            
            <hr>
            
            <p>Hello!</p>
            
            <p>We have received your child’s registration for preschool education. The guardian who filed the application may edit it online until such time as the service coordination team takes it up for processing. The early childhood education services coordination team will enrol every child registered for preschool education with a preschool education unit during March. The decision may be viewed and accepted or rejected online at varhaiskasvatus.ouka.fi.</p>
            
            <p>If no preschool education group will be set up in the unit you have applied for, the coordination team will contact you and offer a spot in a unit where such a group will be set up.</p>
      
            <p>If you have specified a need for special support for your child in the application, a special needs early childhood education teacher will contact you in order to best consider your child’s need for support in making the enrolment decision.</p>
       
            <p>EARLY CHILDHOOD EDUCATION AND CARE IN CONJUNCTION WITH PRESCHOOL EDUCATION</p>
   
            <p>If you have applied for early childhood education and care services in conjunction with preschool education, please consider the following:</p>
    
            <ul><li>The time necessary to organize a berth in early childhood education and care is four months. Extended opening hours and round-the-clock care services are provided if necessitated by the parents’ working hours or evening and/or weekend studies.</li>
            <li><b>If placement in early childhood care and education can be offered for your child in one of the municipal early childhood education and care locations specified in your application,</b> we will inform you of the location two before the intended start date at the latest. If not, we will contact you by telephone.</li>
            <li><b>If the first care location you picked is a private daycare centre,</b> you should directly contact the service provider in question to ensure placement can be offered to you. If the service provider your picked is unable to offer you a berth in care, we request you to contact the early childhood education and care services service counselling centre.</li>
            <li><b>Transfer applications</b>  (for children who are already enrolled in a City of Oulu early childhood education and care unit) will usually be processed in the order such applications are received. Acceptable reasons for transfer include: shutdown of the current care location, siblings enrolled in a different unit, a long distance, poor transportation connections, the age of the child, the age structure of the group, the end of a need for round-the-clock care, and other specific grounds to be considered individually.</li>
            </ul>
    
            <p>The decision may be viewed and accepted or rejected online at <a href="https://varhaiskasvatus.ouka.fi">varhaiskasvatus.ouka.fi.</a></p>
            
            <p>The appendices to the application may be directly submitted with the online application through the eVaka service.</p>
            
            <p>Yours, <br/>
            Early childhood education services coordination team <br/>
            </p>
            
            <p>You may not reply to this message.</p>
        """.trimIndent()
    }

    override fun getPreschoolApplicationReceivedEmailText(withinApplicationPeriod: Boolean): String {
        return """
            Hei! 

            Olemme vastaanottaneet lapsenne ilmoittautumisen esiopetukseen. Hakemuksen tehnyt huoltaja voi muokata hakemusta siihen saakka, kunnes palveluohjaus ottaa sen käsittelyyn. Varhaiskasvatuksen palveluohjaus sijoittaa kaikki esiopetukseen ilmoitetut lapset esiopetusyksiköihin maaliskuun aikana. Päätös on nähtävissä ja hyväksyttävissä/hylättävissä varhaiskasvatus.ouka.fi.  

            Mikäli hakemaanne yksikköön ei perusteta esiopetusryhmää, palveluohjaus on teihin yhteydessä ja tarjoaa paikkaa sellaisesta yksiköstä, johon esiopetusryhmä on muodostunut.          

            Mikäli ilmoititte hakemuksessa lapsenne tuen tarpeesta, varhaiskasvatuksen erityisopettaja on teihin yhteydessä, jotta lapsen tuen tarpeet voidaan ottaa huomioon paikkaa osoitettaessa.  

            ESIOPETUKSEEN LIITTYVÄ VARHAISKASVATUS 

            Mikäli hait esiopetukseen liittyvää varhaiskasvatusta, otathan huomioon: 

            - Varhaiskasvatuspaikan järjestelyaika on neljä kuukautta. Jatketun aukiolon ja vuorohoidon palveluita järjestetään vanhempien vuorotyön tai iltaisin ja/tai viikonloppuisin tapahtuvan opiskelun perusteella. 

            - Mikäli lapsellenne järjestyy varhaiskasvatuspaikka jostakin hakemuksessa toivomastanne kunnallisesta varhaiskasvatuspaikasta, ilmoitamme teille paikan viimeistään kaksi viikkoa ennen varhaiskasvatuksen toivottua aloitusajankohtaa. Muussa tapauksessa olemme teihin yhteydessä.  

            - Mikäli valitsitte ensimmäiseksi hakutoiveeksi yksityisen päiväkodin, olkaa suoraan yhteydessä kyseiseen yksikköön varmistaaksenne varhaiskasvatuspaikan saamisen. Mikäli toivomanne palveluntuottaja ei pysty tarjoamaan varhaiskasvatuspaikkaa, pyydämme teitä olemaan yhteydessä varhaiskasvatuksen palveluohjaukseen. 

            - Siirtohakemukset (lapsella on jo varhaiskasvatuspaikka Oulun kaupungin varhaiskasvatusyksikössä) käsitellään pääsääntöisesti hakemuksen saapumispäivämäärän mukaan. Merkittäviä syitä siirtoon ovat: aikaisemman varhaiskasvatuspaikan lakkauttaminen, sisarukset ovat eri yksiköissä, pitkä matka, huonot kulkuyhteydet, lapsen ikä, ryhmän ikärakenne, vuorohoidon tarpeen loppuminen sekä huomioon otettavat erityisperusteet. 

            Päätös on nähtävissä ja hyväksyttävissä/hylättävissä varhaiskasvatus.ouka.fi.  

            Hakemuksen liitteet lisätään suoraan sähköiselle hakemukselle eVakassa. 

            Ystävällisesti, 
            Varhaiskasvatuksen palveluohjaus 
                        
            Tähän viestiin ei voi vastata.
            
            ------------------------------------------------------------------------------
            
            Hello! 

            We have received your child’s registration for preschool education. The guardian who filed the application may edit it online until such time as the service coordination team takes it up for processing. The early childhood education services coordination team will enrol every child registered for preschool education with a preschool education unit during March. The decision may be viewed and accepted or rejected online at varhaiskasvatus.ouka.fi.  

            If no preschool education group will be set up in the unit you have applied for, the coordination team will contact you and offer a spot in a unit where such a group will be set up. 

            If you have specified a need for special support for your child in the application, a special needs early childhood education teacher will contact you in order to best consider your child’s need for support in making the enrolment decision.  

            EARLY CHILDHOOD EDUCATION AND CARE IN CONJUNCTION WITH PRESCHOOL EDUCATION             
             
            If you have applied for early childhood education and care services in conjunction with preschool education, please consider the following: 

            - The time necessary to organize a berth in early childhood education and care is four months. Extended opening hours and round-the-clock care services are provided if necessitated by the parents’ working hours or evening and/or weekend studies. 

            - If placement in early childhood care and education can be offered for your child in one of the municipal early childhood education and care locations specified in your application, we will inform you of the location two before the intended start date at the latest. If not, we will contact you by telephone.  

            - If the first care location you picked is a private daycare centre, you should directly contact the service provider in question to ensure placement can be offered to you. If the service provider your picked is unable to offer you a berth in care, we request you to contact the early childhood education and care services service counselling centre. 

            - Transfer applications (for children who are already enrolled in a City of Oulu early childhood education and care unit) will usually be processed in the order such applications are received. Acceptable reasons for transfer include: shutdown of the current care location, siblings enrolled in a different unit, a long distance, poor transportation connections, the age of the child, the age structure of the group, the end of a need for round-the-clock care, and other specific grounds to be considered individually. 

            The decision may be viewed and accepted or rejected online at varhaiskasvatus.ouka.fi.         

            The appendices to the application may be directly submitted with the online application through the eVaka service.  

            Yours, 
            Early childhood education services coordination team 
            
            You may not reply to this message. 
            
        """.trimIndent()
    }

    override fun getDecisionEmailHtml(childId: ChildId, decisionId: AssistanceNeedDecisionId): String {
        return "X"
    }

    override fun getDecisionEmailText(childId: ChildId, decisionId: AssistanceNeedDecisionId): String {
        return "X"
    }
}