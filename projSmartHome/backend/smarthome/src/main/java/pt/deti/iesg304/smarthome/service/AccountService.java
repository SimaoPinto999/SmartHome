package pt.deti.iesg304.smarthome.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import pt.deti.iesg304.smarthome.dto.AccountRequest;
import pt.deti.iesg304.smarthome.dto.AccountResponse;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.repository.AccountRepository;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    /**
     * Account Service constructor.
     * @param accountRepository Repository for Account entities.
     */
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    /**
     * Lists all accounts.
     * @return List of AccountResponse.
     */
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns an account by id.
     * @param accountId - Id of the account.
     * @return AccountResponse.
     */
    public AccountResponse getAccountById(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        return toResponse(account);
    }

    /**
     * Returns an account by email.
     * @param email - Email of the account.
     * @return AccountResponse.
     */
    public AccountResponse getAccountByEmail(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));

        return toResponse(account);
    }

    /**
     * Creates a new account (password stored with BCrypt).
     * @param request - AccountRequest containing the account data.
     * @return AccountResponse.
     */
    public AccountResponse createAccount(AccountRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        Account account = toModel(request);
        Account saved = accountRepository.save(account);

        return toResponse(saved);
    }

    /**
     * Updates email and/or password of an existing account.
     * @param accountId - Id of the account.
     * @param request - AccountRequest containing the account data.
     * @return AccountResponse.
     */
    public AccountResponse updateAccount(Long accountId, AccountRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!account.getEmail().equals(request.getEmail()) && accountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        account.setEmail(request.getEmail());

        return toResponse(accountRepository.save(account));
    }

    /**
     * Returns the account for the given email, creating it if it doesn't exist yet.
     * @param email - Email of the account.
     * @return AccountResponse.
     */
    public AccountResponse provisionAccount(String email) {
        return accountRepository.findByEmail(email)
                .map(this::toResponse)
                .orElseGet(() -> {
                    Account account = new Account();
                    account.setEmail(email);
                    account.setCreatedAt(LocalDateTime.now());
                    return toResponse(accountRepository.save(account));
                });
    }

    /**
     * Removes an account by id.
     * @param accountId - Id of the account.
     */
    public void deleteAccount(Long accountId) {
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Account not found: " + accountId);
        }
        accountRepository.deleteById(accountId);
    }

    /**
     * Converts an Account entity to an AccountResponse.
     * @param account - Account entity.
     * @return AccountResponse.
     */
    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getAccountId(),
                account.getEmail(),
                account.getCreatedAt()
        );
    }

    /**
     * Converts an AccountRequest to an Account entity.
     * @param request - AccountRequest containing the account data.
     * @return Account entity.
     */
    private Account toModel(AccountRequest request) {
        Account account = new Account();
        account.setEmail(request.getEmail());
        account.setCreatedAt(LocalDateTime.now());
        return account;
    }
}
