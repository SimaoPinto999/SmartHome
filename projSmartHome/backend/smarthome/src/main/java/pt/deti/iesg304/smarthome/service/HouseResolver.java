package pt.deti.iesg304.smarthome.service;

import org.springframework.stereotype.Component;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.repository.AccountRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;

import java.util.List;

@Component
public class HouseResolver {

    private final AccountRepository accountRepository;
    private final HouseRepository houseRepository;

    public HouseResolver(AccountRepository accountRepository, HouseRepository houseRepository) {
        this.accountRepository = accountRepository;
        this.houseRepository = houseRepository;
    }

    public House resolve(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
        List<House> houses = houseRepository.findByAccount_AccountId(account.getAccountId());
        if (houses.isEmpty()) throw new ResourceNotFoundException("No house found for: " + email);
        return houses.get(0);
    }
}
