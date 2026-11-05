
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class HomePageTest {
    public static void main(String[] args) {

        WebDriver driver = new ChromeDriver();

        driver.manage().window().maximize();

        driver.get("http://localhost:3000");

        System.out.println("Website Title: " + driver.getTitle());

        System.out.println("Selenium Test Successful!");

        driver.quit();
    }
}
